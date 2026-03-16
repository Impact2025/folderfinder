/**
 * Aldi NL scraper
 * Fetches promotions from the Aldi Nederland website
 * Free, no API key required
 */

import type { RawDeal, ScraperResult } from './types'
import { getWeekDates } from './utils'

const ALDI_OFFERS_URL = 'https://www.aldi.nl/aanbiedingen/aanbiedingen-van-deze-week.html'

interface AldiProduct {
  name: string
  price: number
  originalPrice?: number
  discount?: string
  category?: string
  image?: string
}

/** Parse €1,99 / €1.99 / 1,99 style strings to a float */
function parseDutchPrice(raw: string): number | null {
  const cleaned = raw.replace(/[€\s]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

/**
 * Aldi NL uses server-rendered HTML. We look for product tiles that typically
 * contain the product name and price in structured markup.
 */
function parseAldiHtml(html: string): AldiProduct[] {
  const products: AldiProduct[] = []

  // Aldi NL product tile pattern — class names vary but price containers are consistent
  // Try to find JSON-LD structured data first (most reliable)
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Product' || item['@type'] === 'Offer') {
          const offers = item.offers ?? item
          const price = typeof offers.price === 'number' ? offers.price : parseDutchPrice(String(offers.price ?? ''))
          if (!price) continue
          products.push({
            name: item.name ?? item.description ?? 'Onbekend product',
            price,
            originalPrice: undefined,
            category: item.category ?? undefined,
            image: item.image ?? undefined,
          })
        }
        if (item['@type'] === 'ItemList') {
          for (const listItem of item.itemListElement ?? []) {
            const product = listItem.item ?? listItem
            if (!product.name) continue
            const offers = product.offers ?? {}
            const price = parseDutchPrice(String(offers.price ?? ''))
            if (!price) continue
            products.push({
              name: product.name,
              price,
              image: product.image ?? undefined,
            })
          }
        }
      }
    } catch { /* ignore parse errors */ }
  }

  if (products.length > 0) return products

  // Fallback: regex scan for price patterns near product names
  // Aldi uses patterns like data-price="1.99" or class="price"
  const pricePattern = /data-price="([\d.,]+)"/g
  const namePattern = /data-name="([^"]+)"/g

  const prices: number[] = []
  const names: string[] = []

  let m
  while ((m = pricePattern.exec(html)) !== null) {
    const p = parseDutchPrice(m[1])
    if (p) prices.push(p)
  }
  while ((m = namePattern.exec(html)) !== null) {
    names.push(m[1])
  }

  const count = Math.min(names.length, prices.length)
  for (let i = 0; i < count; i++) {
    products.push({ name: names[i], price: prices[i] })
  }

  return products
}

export async function scrapeAldi(): Promise<ScraperResult> {
  const { validFrom, validUntil } = getWeekDates()

  try {
    const res = await fetch(ALDI_OFFERS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return { supermarketSlug: 'aldi', deals: [], scrapedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const products = parseAldiHtml(html)

    const deals: RawDeal[] = products.map((p, i) => ({
      externalId: `aldi-${i}-${p.name.slice(0, 20).replace(/\s+/g, '-')}`,
      productName: p.name,
      category: p.category,
      normalPrice: p.originalPrice,
      dealPrice: p.price,
      discountLabel: p.discount,
      imageUrl: p.image,
      validFrom,
      validUntil,
    }))

    console.log(`Aldi: scraped ${deals.length} deals`)
    return { supermarketSlug: 'aldi', deals, scrapedAt: new Date().toISOString() }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Aldi scraper failed:', error)
    return { supermarketSlug: 'aldi', deals: [], scrapedAt: new Date().toISOString(), error }
  }
}
