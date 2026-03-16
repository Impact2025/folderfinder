/**
 * Albert Heijn scraper
 * Uses the unofficial AH mobile API to fetch bonus/deals
 * Endpoints reverse-engineered from the AH app
 */

import type { RawDeal, ScraperResult } from './types'
import { getWeekDates } from './utils'

const AH_API_BASE = 'https://api.ah.nl/mobile-services'
const AH_PRODUCTS_API = 'https://api.ah.nl'

// AH requires a client token for some endpoints; public product search doesn't
const DEFAULT_HEADERS = {
  'User-Agent': 'Appie/8.22.3 (nl.ahold.ahapp; build:8.22.3; iOS 16.6.0)',
  'x-application': 'APPIE',
  'Accept': 'application/json',
  'Accept-Language': 'nl-NL',
}

interface AHBonusProduct {
  id: number
  title: string
  price?: { now: number; was?: number; unitSize?: string }
  discountLabels?: string[]
  images?: Array<{ url: string }>
  category?: { name: string }
  brand?: string
  gtin?: string
  discount?: { tieredOffer?: Array<{ from: number; price: number }> }
  promotions?: Array<{
    startDate: string
    endDate: string
    description: string
    discount?: { amount?: number; percentage?: number }
  }>
}

async function fetchAHBonusPage(page: number): Promise<AHBonusProduct[]> {
  const url = `${AH_API_BASE}/product/search/v2?sortOn=RELEVANCE&size=30&page=${page}&taxonomyId=0&withCount=true&filters=bonus%3Atrue`

  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`AH API page ${page} returned ${res.status}`)
      return []
    }

    const data = await res.json()
    return data?.products?.map((p: Record<string, unknown>) => p.product) ?? []
  } catch (err) {
    console.error(`AH fetch page ${page} failed:`, err)
    return []
  }
}

function mapAHProduct(p: AHBonusProduct, validFrom: string, validUntil: string): RawDeal | null {
  if (!p?.id) return null

  const now = p.price?.now
  const was = p.price?.was
  const label = p.discountLabels?.[0] ?? p.promotions?.[0]?.description

  if (!now && now !== 0) return null

  // Use promotion dates if available
  const promo = p.promotions?.[0]
  const from = promo?.startDate ? promo.startDate.split('T')[0] : validFrom
  const until = promo?.endDate ? promo.endDate.split('T')[0] : validUntil

  return {
    externalId: `ah-${p.id}`,
    productName: p.title,
    brand: p.brand ?? undefined,
    category: p.category?.name ?? undefined,
    normalPrice: was ?? undefined,
    dealPrice: now,
    discountLabel: label ?? undefined,
    unitSize: p.price?.unitSize ?? undefined,
    imageUrl: p.images?.[0]?.url ?? undefined,
    validFrom: from,
    validUntil: until,
    barcode: p.gtin ?? undefined,
    rawData: p as unknown as Record<string, unknown>,
  }
}

export async function scrapeAH(): Promise<ScraperResult> {
  const { validFrom, validUntil } = getWeekDates()
  const deals: RawDeal[] = []

  try {
    // Fetch up to 10 pages (300 bonus products)
    const pagePromises = Array.from({ length: 10 }, (_, i) => fetchAHBonusPage(i))
    const pages = await Promise.all(pagePromises)

    for (const products of pages) {
      for (const p of products) {
        const deal = mapAHProduct(p, validFrom, validUntil)
        if (deal) deals.push(deal)
      }
    }

    console.log(`AH: scraped ${deals.length} deals`)
    return { supermarketSlug: 'ah', deals, scrapedAt: new Date().toISOString() }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('AH scraper failed:', error)
    return { supermarketSlug: 'ah', deals, scrapedAt: new Date().toISOString(), error }
  }
}
