import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchAllSources } from '@/lib/search/aggregator'
import { getCached, setCache, buildCacheKey } from '@/lib/cache/redis'
import { createServiceClient } from '@/lib/supabase/server'

const SearchSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year:  z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  part:  z.string().min(2).max(200),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'validation_count']).optional(),
  onlyValidated: z.coerce.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const raw = Object.fromEntries(url.searchParams.entries())

  const parsed = SearchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { brand, model, year, part, sortBy, onlyValidated } = parsed.data
  const cacheKey = buildCacheKey(brand, model, year, part)

  // Cache hit
  const cached = await getCached(cacheKey)
  if (cached) {
    return NextResponse.json({ results: cached, fromCache: true })
  }

  // Fetch from all sources
  const results = await searchAllSources(
    { brand, model, year, part },
    { sortBy, onlyValidated }
  )

  // Log search (fire-and-forget)
  const supabase = createServiceClient()
  Promise.resolve(
    supabase.from('searches').insert({
      brand, model, year,
      parts_searched: part,
      result_count: results.length,
    })
  ).catch(() => null)

  // Store in cache (fire-and-forget)
  setCache(cacheKey, results).catch(() => null)

  return NextResponse.json({ results, fromCache: false })
}
