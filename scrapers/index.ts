/**
 * Scraper orchestrator
 * Runs all supermarket scrapers and saves to Neon PostgreSQL
 */

import { neon } from '@neondatabase/serverless'
import { scrapeAH } from './ah'
import { scrapeJumbo } from './jumbo'
import { scrapeViaApify } from './apify'
import { getWeekDates } from './utils'
import { normalizeProductName, extractUnitSize, computePricePerUnit } from '../lib/normalize'
import { calculateDiscountPercent, parseSpecialDeal } from '../lib/discount'
import type { RawDeal, ScraperResult } from './types'

const sql = neon(process.env.DATABASE_URL!)

async function getSupermarketId(slug: string): Promise<number | null> {
  const rows = await sql`SELECT id FROM supermarkets WHERE slug = ${slug} AND is_active = true`
  return rows[0]?.id ?? null
}

async function saveDeal(supermarketId: number, deal: RawDeal, week: number, year: number): Promise<'inserted' | 'updated' | 'skipped'> {
  const { cleanName, unitSize } = extractUnitSize(deal.productName)
  const normalizedName = normalizeProductName(deal.productName)
  const resolvedUnitSize = deal.unitSize ?? unitSize

  const { effectiveDiscountPercent } = parseSpecialDeal(deal.discountLabel, deal.dealPrice, deal.normalPrice)
  const discountPct = effectiveDiscountPercent ?? calculateDiscountPercent(deal.normalPrice, deal.dealPrice)
  const pricePerUnit = resolvedUnitSize ? computePricePerUnit(deal.dealPrice, resolvedUnitSize) : null

  try {
    const result = await sql`
      INSERT INTO deals (
        supermarket_id, external_id, product_name, normalized_name,
        brand, category, normal_price, deal_price, discount_percent,
        discount_label, unit_size, price_per_unit, image_url,
        valid_from, valid_until, week_number, year, barcode, raw_data,
        updated_at
      ) VALUES (
        ${supermarketId}, ${deal.externalId}, ${deal.productName}, ${normalizedName},
        ${deal.brand ?? null}, ${deal.category ?? null},
        ${deal.normalPrice ?? null}, ${deal.dealPrice}, ${discountPct},
        ${deal.discountLabel ?? null}, ${resolvedUnitSize ?? null}, ${pricePerUnit},
        ${deal.imageUrl ?? null}, ${deal.validFrom}, ${deal.validUntil},
        ${week}, ${year}, ${deal.barcode ?? null},
        ${deal.rawData ? JSON.stringify(deal.rawData) : null},
        NOW()
      )
      ON CONFLICT (supermarket_id, external_id, valid_from)
      DO UPDATE SET
        product_name     = EXCLUDED.product_name,
        normalized_name  = EXCLUDED.normalized_name,
        normal_price     = EXCLUDED.normal_price,
        deal_price       = EXCLUDED.deal_price,
        discount_percent = EXCLUDED.discount_percent,
        discount_label   = EXCLUDED.discount_label,
        unit_size        = EXCLUDED.unit_size,
        price_per_unit   = EXCLUDED.price_per_unit,
        image_url        = EXCLUDED.image_url,
        updated_at       = NOW()
      RETURNING (xmax = 0) AS inserted
    `
    return result[0]?.inserted ? 'inserted' : 'updated'
  } catch {
    return 'skipped'
  }
}

async function saveHistoryEntry(supermarketId: number, deal: RawDeal, week: number, year: number): Promise<void> {
  if (!deal.normalPrice && !deal.dealPrice) return
  const discountPct = calculateDiscountPercent(deal.normalPrice, deal.dealPrice)

  await sql`
    INSERT INTO price_history (supermarket_id, barcode, product_name, normal_price, deal_price, discount_percent, week_number, year)
    VALUES (${supermarketId}, ${deal.barcode ?? null}, ${deal.productName}, ${deal.normalPrice ?? null}, ${deal.dealPrice}, ${discountPct}, ${week}, ${year})
    ON CONFLICT DO NOTHING
  `.catch(() => {/* ignore duplicates */})
}

async function processResult(result: ScraperResult): Promise<{ inserted: number; updated: number; errors: number }> {
  const supermarketId = await getSupermarketId(result.supermarketSlug)
  if (!supermarketId) {
    console.warn(`Unknown supermarket slug: ${result.supermarketSlug}`)
    return { inserted: 0, updated: 0, errors: 0 }
  }

  const { week, year } = getWeekDates()
  let inserted = 0, updated = 0, errors = 0

  for (const deal of result.deals) {
    const status = await saveDeal(supermarketId, deal, week, year)
    if (status === 'inserted') inserted++
    else if (status === 'updated') updated++
    else errors++

    // Save to history (don't await to speed up bulk insert)
    saveHistoryEntry(supermarketId, deal, week, year).catch(() => {})
  }

  return { inserted, updated, errors }
}

async function logScrapeRun(
  supermarketId: number | null,
  week: number,
  year: number,
  status: 'success' | 'error',
  inserted: number,
  updated: number,
  error?: string
): Promise<void> {
  await sql`
    INSERT INTO scrape_log (supermarket_id, week_number, year, finished_at, deals_inserted, deals_updated, status, error_message)
    VALUES (${supermarketId}, ${week}, ${year}, NOW(), ${inserted}, ${updated}, ${status}, ${error ?? null})
  `.catch(() => {})
}

export async function runAllScrapers(): Promise<void> {
  console.log('🛒 FolderFinder scraper started:', new Date().toISOString())
  const { week, year } = getWeekDates()

  // Run AH and Jumbo in parallel (direct APIs, fast)
  const [ahResult, jumboResult] = await Promise.all([
    scrapeAH(),
    scrapeJumbo(),
  ])

  // Run Apify for remaining supermarkets
  const apifyResults = await scrapeViaApify()

  const allResults = [ahResult, jumboResult, ...apifyResults]

  let totalInserted = 0, totalUpdated = 0

  for (const result of allResults) {
    if (result.error) {
      console.error(`❌ ${result.supermarketSlug}: ${result.error}`)
      const id = await getSupermarketId(result.supermarketSlug)
      await logScrapeRun(id, week, year, 'error', 0, 0, result.error)
      continue
    }

    const { inserted, updated, errors } = await processResult(result)
    totalInserted += inserted
    totalUpdated += updated

    console.log(`✅ ${result.supermarketSlug}: +${inserted} new, ~${updated} updated, ${errors} skipped`)

    const id = await getSupermarketId(result.supermarketSlug)
    await logScrapeRun(id, week, year, 'success', inserted, updated)
  }

  console.log(`\n🎉 Done! Total: +${totalInserted} new, ~${totalUpdated} updated`)
}
