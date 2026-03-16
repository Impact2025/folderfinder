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
  validFrom: string   // ISO date: "2025-03-17"
  validUntil: string  // ISO date: "2025-03-23"
  barcode?: string
  rawData?: Record<string, unknown>
}

export interface ScraperResult {
  supermarketSlug: string
  deals: RawDeal[]
  scrapedAt: string
  error?: string
}
