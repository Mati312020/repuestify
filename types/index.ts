export type PartSource = 'mercadolibre' | 'repuestera' | 'marketplace'

export type Availability = 'in_stock' | 'out_of_stock' | 'unknown'

export interface SearchResult {
  id: string
  source: PartSource
  title: string
  price: number
  currency: 'ARS' | 'USD'
  priceARS: number
  availability: Availability
  url: string
  thumbnail?: string
  sellerName?: string
  sellerRating?: number
  condition: 'new' | 'used' | 'refurbished'
  validationCount: number
  isValidated: boolean
}

export interface SearchParams {
  brand: string
  model: string
  year: number
  part: string
}

export interface VehicleBrand {
  id: string
  name: string
}

export interface VehicleModel {
  id: string
  brandId: string
  name: string
}

export interface PartValidation {
  id: string
  userId: string
  partSourceId: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: number
  notes?: string
  validatedAt: string
}

export interface SearchFilters {
  minPrice?: number
  maxPrice?: number
  availability?: Availability[]
  condition?: ('new' | 'used' | 'refurbished')[]
  sortBy?: 'price_asc' | 'price_desc' | 'relevance' | 'validation_count'
  onlyValidated?: boolean
  sources?: PartSource[]
}
