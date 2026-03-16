/**
 * Jumbo scraper
 * Uses the Jumbo mobile API (publicly accessible, no auth required)
 */

import type { RawDeal, ScraperResult } from './types'
import { getWeekDates } from './utils'

const JUMBO_API = 'https://mobileapi.jumbo.com/v17'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'nl-NL,nl;q=0.9',
}

interface JumboPromotion {
  id: string
  title: string
  subtitle?: string
  fromDate: string
  toDate: string
  image?: { url: string }
  products?: JumboProduct[]
}

interface JumboProduct {
  id: string
  title: string
  brand?: string
  category?: { name: string }
  prices?: {
    price: { amount: number }
    promotionalPrice?: { amount: number }
    unitPrice?: { price: { amount: number }; unit: string }
  }
  imageInfo?: { primaryView?: Array<{ url: string }> }
  crossSellItems?: { productGtins?: string[] }
  quantity?: string
  promotionLabel?: string
  promotionGroups?: Array<{
    title: string
    fromDate: string
    toDate: string
  }>
}

async function fetchJumboDealsPage(offset: number): Promise<JumboProduct[]> {
  const url = `${JUMBO_API}/search?q=&filters=inPromotion%3Atrue&size=30&offset=${offset}&sort=promotions`

  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`Jumbo API offset=${offset} returned ${res.status}`)
      return []
    }

    const data = await res.json()
    return data?.products?.data ?? []
  } catch (err) {
    console.error(`Jumbo fetch offset=${offset} failed:`, err)
    return []
  }
}

function mapJumboProduct(p: JumboProduct, validFrom: string, validUntil: string): RawDeal | null {
  if (!p?.id || !p.title) return null

  const normalCents = p.prices?.price?.amount
  const dealCents = p.prices?.promotionalPrice?.amount ?? p.prices?.price?.amount

  if (!dealCents) return null

  const normal = normalCents ? normalCents / 100 : undefined
  const deal = dealCents / 100

  const promo = p.promotionGroups?.[0]
  const from = promo?.fromDate ? promo.fromDate.split('T')[0] : validFrom
  const until = promo?.toDate ? promo.toDate.split('T')[0] : validUntil

  const label = p.promotionLabel ?? p.promotionGroups?.[0]?.title

  return {
    externalId: `jumbo-${p.id}`,
    productName: p.title,
    brand: p.brand ?? undefined,
    category: p.category?.name ?? undefined,
    normalPrice: normal,
    dealPrice: deal,
    discountLabel: label ?? undefined,
    unitSize: p.quantity ?? undefined,
    imageUrl: p.imageInfo?.primaryView?.[0]?.url ?? undefined,
    validFrom: from,
    validUntil: until,
    barcode: p.crossSellItems?.productGtins?.[0] ?? undefined,
    rawData: p as unknown as Record<string, unknown>,
  }
}

export async function scrapeJumbo(): Promise<ScraperResult> {
  const { validFrom, validUntil } = getWeekDates()
  const deals: RawDeal[] = []

  try {
    // Parallel fetch of 10 pages (300 products)
    const offsets = Array.from({ length: 10 }, (_, i) => i * 30)
    const pages = await Promise.all(offsets.map(offset => fetchJumboDealsPage(offset)))

    const seen = new Set<string>()
    for (const products of pages) {
      for (const p of products) {
        if (seen.has(p.id)) continue
        seen.add(p.id)
        const deal = mapJumboProduct(p, validFrom, validUntil)
        if (deal) deals.push(deal)
      }
    }

    console.log(`Jumbo: scraped ${deals.length} deals`)
    return { supermarketSlug: 'jumbo', deals, scrapedAt: new Date().toISOString() }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Jumbo scraper failed:', error)
    return { supermarketSlug: 'jumbo', deals, scrapedAt: new Date().toISOString(), error }
  }
}
