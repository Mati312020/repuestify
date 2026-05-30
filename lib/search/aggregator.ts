import type { SearchParams, SearchResult, SearchFilters } from '@/types'
import { searchMercadoLibre } from './mercadolibre'
import { withTimeout } from '@/lib/utils'

const SOURCE_TIMEOUT_MS = 5000

function applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
  let filtered = results

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((r) => r.priceARS >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((r) => r.priceARS <= filters.maxPrice!)
  }
  if (filters.availability?.length) {
    filtered = filtered.filter((r) => filters.availability!.includes(r.availability))
  }
  if (filters.condition?.length) {
    filtered = filtered.filter((r) => filters.condition!.includes(r.condition))
  }
  if (filters.onlyValidated) {
    filtered = filtered.filter((r) => r.isValidated)
  }
  if (filters.sources?.length) {
    filtered = filtered.filter((r) => filters.sources!.includes(r.source))
  }

  // Sort
  switch (filters.sortBy) {
    case 'price_asc':
      filtered.sort((a, b) => a.priceARS - b.priceARS)
      break
    case 'price_desc':
      filtered.sort((a, b) => b.priceARS - a.priceARS)
      break
    case 'validation_count':
      filtered.sort((a, b) => b.validationCount - a.validationCount)
      break
    default:
      // relevance: validated first, then by price asc
      filtered.sort((a, b) => {
        if (a.isValidated !== b.isValidated) return a.isValidated ? -1 : 1
        return a.priceARS - b.priceARS
      })
  }

  return filtered
}

export async function searchAllSources(
  params: SearchParams,
  filters: SearchFilters = {}
): Promise<SearchResult[]> {
  // Execute all sources in parallel with individual timeouts
  const [mlResults] = await Promise.all([
    withTimeout(searchMercadoLibre(params), SOURCE_TIMEOUT_MS),
    // Future: withTimeout(searchRepuestera1(params), SOURCE_TIMEOUT_MS),
    // Future: withTimeout(searchMarketplace(params), SOURCE_TIMEOUT_MS),
  ])

  const combined: SearchResult[] = [
    ...(mlResults ?? []),
  ]

  return applyFilters(combined, filters)
}
