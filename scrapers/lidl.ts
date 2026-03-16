/**
 * Lidl NL scraper
 * Fetches promotions from the Lidl website via __NEXT_DATA__ JSON blob
 * Free, no API key required
 */

import type { RawDeal, ScraperResult } from './types'
import { getWeekDates } from './utils'

const LIDL_URL = 'https://www.lidl.nl/p/aanbiedingen'

interface LidlOffer {
  id?: string
  name?: string
  title?: string
  price?: number | { value?: number; original?: number }
  originalPrice?: number
  startDate?: string
  endDate?: string
  category?: string
  image?: string
  description?: string
  discount?: string | number
}

function parsePrice(p: unknown): number | undefined {
  if (typeof p === 'number') return p
  if (typeof p === 'object' && p !== null) {
    const obj = p as Record<string, unknown>
    const v = obj.value ?? obj.amount ?? obj.price
    if (typeof v === 'number') return v
    if (typeof v === 'string') return parseFloat(v) || undefined
  }
  return undefined
}

function mapLidlOffer(o: LidlOffer, validFrom: string, validUntil: string): RawDeal | null {
  const name = o.name ?? o.title
  if (!name) return null

  const dealPrice = parsePrice(
    typeof o.price === 'object' ? (o.price as Record<string, unknown>).value ?? o.price : o.price
  )
  if (!dealPrice) return null

  const normalPrice = parsePrice(
    typeof o.price === 'object'
      ? (o.price as Record<string, unknown>).original ?? undefined
      : undefined
  ) ?? parsePrice(o.originalPrice)

  const id = o.id ?? `lidl-${name}-${dealPrice}`

  return {
    externalId: `lidl-${id}`,
    productName: name,
    category: o.category ?? undefined,
    normalPrice,
    dealPrice,
    discountLabel: typeof o.discount === 'string' ? o.discount : undefined,
    imageUrl: o.image ?? undefined,
    validFrom: o.startDate ? o.startDate.split('T')[0] : validFrom,
    validUntil: o.endDate ? o.endDate.split('T')[0] : validUntil,
    rawData: o as unknown as Record<string, unknown>,
  }
}

function extractOffersFromNextData(html: string): LidlOffer[] {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return []

  try {
    const json = JSON.parse(match[1])
    const props = json?.props?.pageProps ?? {}

    // Try common paths in Lidl's Next.js data structure
    const candidates = [
      props?.offers,
      props?.data?.offers,
      props?.promotions,
      props?.data?.promotions,
      props?.pageData?.offers,
    ]

    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0) return c
    }

    // Try to find any array with offer-like objects
    const search = (obj: unknown, depth = 0): LidlOffer[] => {
      if (depth > 5 || !obj || typeof obj !== 'object') return []
      if (Array.isArray(obj)) {
        const first = obj[0]
        if (first && typeof first === 'object' && ('name' in first || 'title' in first) && ('price' in first)) {
          return obj as LidlOffer[]
        }
        for (const item of obj.slice(0, 5)) {
          const found = search(item, depth + 1)
          if (found.length > 0) return found
        }
      } else {
        for (const val of Object.values(obj as Record<string, unknown>)) {
          const found = search(val, depth + 1)
          if (found.length > 0) return found
        }
      }
      return []
    }
    return search(props)
  } catch {
    return []
  }
}

export async function scrapeLidl(): Promise<ScraperResult> {
  const { validFrom, validUntil } = getWeekDates()

  try {
    const res = await fetch(LIDL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return { supermarketSlug: 'lidl', deals: [], scrapedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const rawOffers = extractOffersFromNextData(html)

    const deals: RawDeal[] = []
    for (const offer of rawOffers) {
      const deal = mapLidlOffer(offer, validFrom, validUntil)
      if (deal) deals.push(deal)
    }

    console.log(`Lidl: scraped ${deals.length} deals`)
    return { supermarketSlug: 'lidl', deals, scrapedAt: new Date().toISOString() }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Lidl scraper failed:', error)
    return { supermarketSlug: 'lidl', deals: [], scrapedAt: new Date().toISOString(), error }
  }
}
