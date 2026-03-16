/**
 * Apify scraper — fetches remaining 9 supermarkets via Apify actor
 * Actor: apify/dutch-supermarkets-all-11
 * Cost: ~$0.005/result, $5 free/month
 */

import type { RawDeal, ScraperResult } from './types'
import { getWeekDates } from './utils'

const APIFY_BASE = 'https://api.apify.com/v2'
const ACTOR_ID = 'harvestedge/dutch-supermarkets-all-11'

// Supermarkets handled by Apify (AH and Jumbo are handled by direct scrapers)
const APIFY_SUPERMARKETS = ['lidl', 'aldi', 'plus', 'dirk', 'hoogvliet', 'vomar', 'poiesz', 'spar', 'dekamarkt']

interface ApifyProduct {
  store?: string
  name?: string
  brand?: string
  category?: string
  price?: number
  originalPrice?: number
  discountPercentage?: number
  discountLabel?: string
  unit?: string
  image?: string
  startDate?: string
  endDate?: string
  ean?: string
  url?: string
  id?: string
}

function storeToSlug(store: string): string {
  const map: Record<string, string> = {
    'albert heijn': 'ah',
    'ah': 'ah',
    'jumbo': 'jumbo',
    'lidl': 'lidl',
    'aldi': 'aldi',
    'plus': 'plus',
    'dirk': 'dirk',
    'hoogvliet': 'hoogvliet',
    'vomar': 'vomar',
    'poiesz': 'poiesz',
    'spar': 'spar',
    'dekamarkt': 'dekamarkt',
  }
  return map[store.toLowerCase()] ?? store.toLowerCase().replace(/\s+/g, '-')
}

async function runApifyActor(apiToken: string): Promise<ApifyProduct[]> {
  const { validFrom, validUntil } = getWeekDates()

  // Start the actor run
  const runUrl = `${APIFY_BASE}/acts/${encodeURIComponent(ACTOR_ID)}/runs`
  const runRes = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stores: APIFY_SUPERMARKETS,
      maxItemsPerStore: 200,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!runRes.ok) {
    const text = await runRes.text()
    throw new Error(`Apify run start failed: ${runRes.status} ${text}`)
  }

  const runData = await runRes.json()
  const runId = runData?.data?.id
  if (!runId) throw new Error('No run ID returned from Apify')

  console.log(`Apify run started: ${runId}`)

  // Poll for completion (max 5 minutes)
  const startTime = Date.now()
  const maxWait = 5 * 60 * 1000
  const pollInterval = 10000

  while (Date.now() - startTime < maxWait) {
    await new Promise(r => setTimeout(r, pollInterval))

    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
    })

    const statusData = await statusRes.json()
    const status = statusData?.data?.status

    console.log(`Apify run ${runId} status: ${status}`)

    if (status === 'SUCCEEDED') {
      // Fetch dataset items
      const datasetId = statusData?.data?.defaultDatasetId
      const itemsRes = await fetch(
        `${APIFY_BASE}/datasets/${datasetId}/items?format=json&limit=5000`,
        { headers: { 'Authorization': `Bearer ${apiToken}` } }
      )
      return await itemsRes.json()
    }

    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Apify run ${runId} failed with status: ${status}`)
    }
  }

  throw new Error(`Apify run ${runId} timed out after 5 minutes`)
}

function mapApifyProduct(p: ApifyProduct, defaultFrom: string, defaultUntil: string): { slug: string; deal: RawDeal } | null {
  if (!p.name || !p.price) return null

  const slug = storeToSlug(p.store ?? '')
  const from = p.startDate ? p.startDate.split('T')[0] : defaultFrom
  const until = p.endDate ? p.endDate.split('T')[0] : defaultUntil

  return {
    slug,
    deal: {
      externalId: p.id ?? `${slug}-${p.ean ?? p.name}`,
      productName: p.name,
      brand: p.brand ?? undefined,
      category: p.category ?? undefined,
      normalPrice: p.originalPrice ?? undefined,
      dealPrice: p.price,
      discountLabel: p.discountLabel ?? undefined,
      unitSize: p.unit ?? undefined,
      imageUrl: p.image ?? undefined,
      validFrom: from,
      validUntil: until,
      barcode: p.ean ?? undefined,
      rawData: p as unknown as Record<string, unknown>,
    },
  }
}

export async function scrapeViaApify(): Promise<ScraperResult[]> {
  const apiToken = process.env.APIFY_API_TOKEN
  const { validFrom, validUntil } = getWeekDates()

  if (!apiToken) {
    console.warn('APIFY_API_TOKEN not set — skipping Apify scraper')
    return APIFY_SUPERMARKETS.map(slug => ({
      supermarketSlug: slug,
      deals: [],
      scrapedAt: new Date().toISOString(),
      error: 'APIFY_API_TOKEN not configured',
    }))
  }

  try {
    const rawProducts = await runApifyActor(apiToken)
    console.log(`Apify returned ${rawProducts.length} total products`)

    // Group by supermarket
    const bySlug: Record<string, RawDeal[]> = {}
    for (const slug of APIFY_SUPERMARKETS) {
      bySlug[slug] = []
    }

    for (const p of rawProducts) {
      const mapped = mapApifyProduct(p, validFrom, validUntil)
      if (!mapped) continue
      if (bySlug[mapped.slug]) {
        bySlug[mapped.slug].push(mapped.deal)
      }
    }

    return Object.entries(bySlug).map(([slug, deals]) => ({
      supermarketSlug: slug,
      deals,
      scrapedAt: new Date().toISOString(),
    }))
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Apify scraper failed:', error)
    return APIFY_SUPERMARKETS.map(slug => ({
      supermarketSlug: slug,
      deals: [],
      scrapedAt: new Date().toISOString(),
      error,
    }))
  }
}
