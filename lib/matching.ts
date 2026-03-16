import sql from '@/lib/db'
import type { Deal, MatchedGroup } from '@/types'

/**
 * Find deals matching a user's product query using PostgreSQL pg_trgm similarity
 */
export async function findMatchingDeals(
  query: string,
  limit = 20
): Promise<Deal[]> {
  const rows = await sql`
    SELECT
      d.id,
      d.supermarket_id AS "supermarketId",
      s.name           AS "supermarketName",
      s.slug           AS "supermarketSlug",
      s.color          AS "supermarketColor",
      d.external_id    AS "externalId",
      d.product_name   AS "productName",
      d.brand,
      d.category,
      d.normal_price   AS "normalPrice",
      d.deal_price     AS "dealPrice",
      d.discount_percent AS "discountPercent",
      d.discount_label AS "discountLabel",
      d.unit_size      AS "unitSize",
      d.price_per_unit AS "pricePerUnit",
      d.image_url      AS "imageUrl",
      d.valid_from     AS "validFrom",
      d.valid_until    AS "validUntil",
      d.week_number    AS "weekNumber",
      d.year,
      d.barcode,
      GREATEST(
        similarity(lower(d.product_name), lower(${query})),
        similarity(lower(d.normalized_name), lower(${query}))
      ) AS match_score
    FROM deals d
    JOIN supermarkets s ON s.id = d.supermarket_id
    WHERE
      d.valid_from <= CURRENT_DATE
      AND d.valid_until >= CURRENT_DATE
      AND (
        d.product_name ILIKE ${'%' + query + '%'}
        OR d.normalized_name ILIKE ${'%' + query + '%'}
        OR similarity(lower(d.product_name), lower(${query})) > 0.25
        OR similarity(lower(d.normalized_name), lower(${query})) > 0.25
      )
    ORDER BY match_score DESC, d.discount_percent DESC NULLS LAST
    LIMIT ${limit}
  `
  return rows as Deal[]
}

/**
 * Find matches for all user products, returning grouped results
 */
export async function findMatchesForUser(
  userProducts: Array<{ productQuery: string; sortOrder: number }>
): Promise<MatchedGroup[]> {
  const groups = await Promise.all(
    userProducts.map(async ({ productQuery, sortOrder }) => {
      const deals = await findMatchingDeals(productQuery)
      const bestDeal = deals.reduce<Deal | null>((best, deal) => {
        if (!best) return deal
        const bPct = best.discountPercent ?? 0
        const dPct = deal.discountPercent ?? 0
        return dPct > bPct ? deal : best
      }, null)

      return {
        query: productQuery,
        sortOrder,
        deals,
        bestDeal,
      }
    })
  )

  return groups.sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Fetch top 15 deals by discount percentage for the current week
 */
export async function getTop15Deals(): Promise<Deal[]> {
  const rows = await sql`
    SELECT
      d.id,
      d.supermarket_id  AS "supermarketId",
      s.name            AS "supermarketName",
      s.slug            AS "supermarketSlug",
      s.color           AS "supermarketColor",
      d.external_id     AS "externalId",
      d.product_name    AS "productName",
      d.brand,
      d.category,
      d.normal_price    AS "normalPrice",
      d.deal_price      AS "dealPrice",
      d.discount_percent AS "discountPercent",
      d.discount_label  AS "discountLabel",
      d.unit_size       AS "unitSize",
      d.price_per_unit  AS "pricePerUnit",
      d.image_url       AS "imageUrl",
      d.valid_from      AS "validFrom",
      d.valid_until     AS "validUntil",
      d.week_number     AS "weekNumber",
      d.year,
      d.barcode
    FROM deals d
    JOIN supermarkets s ON s.id = d.supermarket_id
    WHERE
      d.valid_from <= CURRENT_DATE
      AND d.valid_until >= CURRENT_DATE
      AND d.discount_percent IS NOT NULL
      AND d.discount_percent > 0
    ORDER BY d.discount_percent DESC
    LIMIT 15
  `
  return rows as Deal[]
}

/**
 * Build price comparison matrix
 */
export async function buildCompareMatrix(
  queries: string[],
  supermarketSlugs: string[]
): Promise<Record<string, Record<string, Deal | null>>> {
  const matrix: Record<string, Record<string, Deal | null>> = {}

  await Promise.all(
    queries.map(async (query) => {
      matrix[query] = {}
      const deals = await findMatchingDeals(query, 50)

      for (const slug of supermarketSlugs) {
        const supermarketDeals = deals.filter(d => d.supermarketSlug === slug)
        // Pick best deal for this supermarket
        matrix[query][slug] = supermarketDeals.sort((a, b) =>
          (b.discountPercent ?? 0) - (a.discountPercent ?? 0)
        )[0] ?? null
      }
    })
  )

  return matrix
}
