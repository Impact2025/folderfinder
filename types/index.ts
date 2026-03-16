export interface Supermarket {
  id: number
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  color: string
  isActive: boolean
}

export interface Deal {
  id: number
  supermarketId: number
  supermarketName: string
  supermarketSlug: string
  supermarketColor: string
  externalId: string | null
  productName: string
  brand: string | null
  category: string | null
  normalPrice: number | null
  dealPrice: number
  discountPercent: number | null
  discountLabel: string | null
  unitSize: string | null
  pricePerUnit: number | null
  imageUrl: string | null
  validFrom: string
  validUntil: string
  weekNumber: number
  year: number
  barcode: string | null
}

export interface UserProduct {
  id: number
  userId: string
  productQuery: string
  sortOrder: number
  createdAt: string
}

export interface MatchedGroup {
  query: string
  sortOrder: number
  deals: Deal[]
  bestDeal: Deal | null
}

export interface CompareCell {
  deal: Deal | null
  isLowest: boolean
}

export interface CompareRow {
  query: string
  cells: Record<string, CompareCell>
  lowestPrice: number | null
  highestSaving: number | null
}

export interface PriceHistoryPoint {
  weekNumber: number
  year: number
  normalPrice: number | null
  dealPrice: number | null
  recordedAt: string
}

export interface RawDeal {
  externalId: string
  productName: string
  brand?: string
  category?: string
  normalPrice?: number
  dealPrice: number
  discountLabel?: string
  unitSize?: string
  imageUrl?: string
  validFrom: string
  validUntil: string
  barcode?: string
  rawData?: Record<string, unknown>
}
