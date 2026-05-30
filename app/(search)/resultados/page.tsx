import { Suspense } from 'react'
import { SearchForm } from '@/components/search/SearchForm'
import { ResultsTable } from '@/components/search/ResultsTable'
import { searchAllSources } from '@/lib/search/aggregator'
import { getCached, setCache, buildCacheKey } from '@/lib/cache/redis'
import type { SearchResult } from '@/types'

interface Props {
  searchParams: Promise<{
    brand?: string
    model?: string
    year?: string
    part?: string
  }>
}

async function Results({ params }: { params: Awaited<Props['searchParams']> }) {
  const { brand, model, year, part } = params

  if (!brand || !model || !year || !part) {
    return (
      <p className="text-gray-500 text-center py-8">
        Completá el formulario para buscar repuestos.
      </p>
    )
  }

  const cacheKey = buildCacheKey(brand, model, Number(year), part)
  let results: SearchResult[] | null = await getCached<SearchResult[]>(cacheKey)

  if (!results) {
    results = await searchAllSources({ brand, model, year: Number(year), part })
    setCache(cacheKey, results).catch(() => null) // fire-and-forget
  }

  return (
    <ResultsTable
      results={results}
      vehicleInfo={`${brand} ${model} ${year}`}
      partQuery={part}
    />
  )
}

export default async function ResultadosPage({ searchParams }: Props) {
  // Next.js 16: searchParams is a Promise
  const params = await searchParams
  const { brand, model, year, part } = params

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search form compacto */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <SearchForm
          initialBrand={brand}
          initialModel={model}
          initialYear={year}
          initialPart={part}
        />
      </div>

      {/* Resultados */}
      <Suspense
        fallback={
          <div className="text-center py-16 text-gray-500">
            <div className="animate-spin text-4xl mb-3">⚙️</div>
            <p>Buscando en todas las fuentes...</p>
          </div>
        }
      >
        <Results params={params} />
      </Suspense>
    </div>
  )
}
