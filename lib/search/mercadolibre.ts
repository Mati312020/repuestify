import type { SearchParams, SearchResult } from '@/types'

const ML_API_BASE = 'https://api.mercadolibre.com'

// ML search API (/sites/MLA/search) is restricted to certified apps.
// We use products/search (catalog) which is accessible and returns
// curated results. The product page URL shows all sellers + prices.

interface MLCatalogProduct {
  id: string
  catalog_product_id: string
  domain_id: string
  category_id: string
  name: string
  pictures?: Array<{ id: string; url: string }>
  attributes?: Array<{ id: string; name: string; value_name: string }>
  status?: string
}

interface MLCatalogResponse {
  results: MLCatalogProduct[]
  paging?: { total: number; offset: number; limit: number }
}

function buildMLSearchUrl(params: SearchParams): string {
  const q = `${params.part} ${params.brand} ${params.model} ${params.year}`
  return `https://listado.mercadolibre.com.ar/${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}`
}

function buildMLProductUrl(catalogId: string): string {
  return `https://www.mercadolibre.com.ar/p/${catalogId}`
}

async function getAccessToken(): Promise<string> {
  // Try stored token first
  const stored = process.env.ML_ACCESS_TOKEN
  if (stored) return stored

  // Fallback: generate via client_credentials
  if (!process.env.ML_APP_ID || !process.env.ML_SECRET_KEY) {
    throw new Error('ML credentials not configured')
  }
  const res = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_SECRET_KEY,
    }),
  })
  const data = await res.json()
  return data.access_token
}

export async function searchMercadoLibre(params: SearchParams): Promise<SearchResult[]> {
  const token = await getAccessToken()
  const query = `${params.brand} ${params.model} ${params.year} ${params.part}`

  const url = new URL(`${ML_API_BASE}/products/search`)
  url.searchParams.set('site_id', 'MLA')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '15')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.error(`[ML] products/search error: ${res.status}`)
    return []
  }

  const data: MLCatalogResponse = await res.json()

  return data.results
    .filter((item) => item.status !== 'inactive' || true) // include all for MVP
    .map((item): SearchResult => {
      const brand = item.attributes?.find((a) => a.id === 'BRAND')?.value_name
      const condition = item.attributes?.find((a) => a.id === 'ITEM_CONDITION')?.value_name

      return {
        id: `ml-${item.id}`,
        source: 'mercadolibre',
        title: item.name,
        price: 0,           // price shown on the ML product page
        currency: 'ARS',
        priceARS: 0,        // user sees prices on the linked ML page
        availability: 'unknown',
        url: buildMLProductUrl(item.catalog_product_id),
        searchUrl: buildMLSearchUrl(params),
        thumbnail: item.pictures?.[0]?.url?.replace('-F.jpg', '-O.jpg'),
        sellerName: brand ?? undefined,
        condition: condition === 'Usado' ? 'used' : 'new',
        validationCount: 0,
        isValidated: false,
        isCatalogLink: true,
      }
    })
}
