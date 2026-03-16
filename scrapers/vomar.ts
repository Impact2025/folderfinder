/**
 * Vomar scraper
 * Fetches promotions from the Vomar website
 * Free, no API key required
 */

import type { RawDeal, ScraperResult } from './types'
import { getWeekDates } from './utils'

const VOMAR_OFFERS_URL = 'https://www.vomar.nl/folder'

function parseDutchPrice(raw: string): number | null {
  const cleaned = raw.replace(/[€\s]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

interface VomarProduct {
  name: string
  price: number
  originalPrice?: number
  discount?: string
  image?: string
}

function parseVomarHtml(html: string): VomarProduct[] {
  const products: VomarProduct[] = []

  // Try JSON-LD structured data first
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Product') {
          const price = parseDutchPrice(String(item.offers?.price ?? item.price ?? ''))
          if (!price || !item.name) continue
          products.push({
            name: item.name,
            price,
            image: item.image ?? undefined,
          })
        }
      }
    } catch { /* ignore */ }
  }

  if (products.length > 0) return products

  // Fallback: regex patterns common in Dutch supermarket sites
  const dataPattern = /data-(?:product-name|title)="([^"]+)"[^>]*>[\s\S]{0,500}?(?:€|data-price=")([\d,\.]+)/g
  let m
  while ((m = dataPattern.exec(html)) !== null) {
    const price = parseDutchPrice(m[2])
    if (!price) continue
    products.push({ name: m[1], price })
  }

  return products
}

export async function scrapeVomar(): Promise<ScraperResult> {
  const { validFrom, validUntil } = getWeekDates()

  try {
    const res = await fetch(VOMAR_OFFERS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return { supermarketSlug: 'vomar', deals: [], scrapedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const products = parseVomarHtml(html)

    const deals: RawDeal[] = products.map((p, i) => ({
      externalId: `vomar-${i}-${p.name.slice(0, 20).replace(/\s+/g, '-')}`,
      productName: p.name,
      normalPrice: p.originalPrice,
      dealPrice: p.price,
      discountLabel: p.discount,
      imageUrl: p.image,
      validFrom,
      validUntil,
    }))

    console.log(`Vomar: scraped ${deals.length} deals`)
    return { supermarketSlug: 'vomar', deals, scrapedAt: new Date().toISOString() }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Vomar scraper failed:', error)
    return { supermarketSlug: 'vomar', deals: [], scrapedAt: new Date().toISOString(), error }
  }
}
