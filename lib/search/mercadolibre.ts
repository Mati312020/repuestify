import type { SearchParams, SearchResult } from '@/types'

const ML_API_BASE = 'https://api.mercadolibre.com'
// MLA1746 = Accesorios y Repuestos para Vehículos (Argentina)
const ML_REPUESTOS_CATEGORY = 'MLA1746'

interface MLItem {
  id: string
  title: string
  price: number
  currency_id: string
  thumbnail: string
  permalink: string
  condition: 'new' | 'used' | 'not_specified'
  available_quantity: number
  seller: { id: number; nickname: string }
  seller_reputation?: { level_id: string | null }
}

interface MLSearchResponse {
  results: MLItem[]
}

function mapCondition(c: string): SearchResult['condition'] {
  if (c === 'new') return 'new'
  if (c === 'used') return 'used'
  return 'refurbished'
}

function mapSellerRating(levelId: string | null | undefined): number | undefined {
  const map: Record<string, number> = {
    '1_red': 1,
    '2_orange': 2,
    '3_yellow': 3,
    '4_light_green': 4,
    '5_green': 5,
  }
  return levelId ? map[levelId] : undefined
}

export async function searchMercadoLibre(params: SearchParams): Promise<SearchResult[]> {
  const query = `${params.brand} ${params.model} ${params.year} ${params.part}`
  const url = new URL(`${ML_API_BASE}/sites/MLA/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('category', ML_REPUESTOS_CATEGORY)
  url.searchParams.set('limit', '20')

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (process.env.ML_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.ML_ACCESS_TOKEN}`
  }

  const res = await fetch(url.toString(), { headers, next: { revalidate: 0 } })
  if (!res.ok) {
    throw new Error(`Mercado Libre API error: ${res.status}`)
  }

  const data: MLSearchResponse = await res.json()

  return data.results.map((item): SearchResult => ({
    id: `ml-${item.id}`,
    source: 'mercadolibre',
    title: item.title,
    price: item.price,
    currency: item.currency_id as 'ARS' | 'USD',
    priceARS: item.currency_id === 'USD' ? item.price * 1000 : item.price, // rough conversion
    availability: item.available_quantity > 0 ? 'in_stock' : 'out_of_stock',
    url: item.permalink,
    thumbnail: item.thumbnail,
    sellerName: item.seller.nickname,
    sellerRating: mapSellerRating(item.seller_reputation?.level_id),
    condition: mapCondition(item.condition),
    validationCount: 0,
    isValidated: false,
  }))
}
