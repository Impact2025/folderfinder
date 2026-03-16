import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getISOWeek, getYear } from 'date-fns'
import { VergelijkTable } from '@/components/vergelijk-table'
import sql from '@/lib/db'
import type { CompareRow } from '@/types'

export const dynamic = 'force-dynamic'

async function fetchCompareData(userId: string): Promise<{
  rows: CompareRow[]
  supermarkets: Array<{ slug: string; name: string; color: string }>
}> {
  const [userProductRows, supermarketRows] = await Promise.all([
    sql`SELECT product_query AS "productQuery", sort_order AS "sortOrder" FROM user_products WHERE user_id = ${userId} ORDER BY sort_order`,
    sql`SELECT slug, name, color FROM supermarkets WHERE is_active = true ORDER BY id`,
  ])

  const userProducts = userProductRows as Array<{ productQuery: string; sortOrder: number }>
  const supermarkets = supermarketRows as Array<{ slug: string; name: string; color: string }>

  if (userProducts.length === 0) return { rows: [], supermarkets }

  const rows = await Promise.all(
    userProducts.map(async ({ productQuery }) => {
      const cells: Record<string, { deal: any; isLowest: boolean }> = {}

      const deals = await sql`
        SELECT DISTINCT ON (s.slug)
          d.deal_price       AS "dealPrice",
          d.normal_price     AS "normalPrice",
          d.discount_percent AS "discountPercent",
          d.discount_label   AS "discountLabel",
          d.product_name     AS "productName",
          d.unit_size        AS "unitSize",
          s.slug             AS "supermarketSlug",
          s.name             AS "supermarketName",
          s.color            AS "supermarketColor"
        FROM deals d
        JOIN supermarkets s ON s.id = d.supermarket_id
        WHERE
          d.valid_from  <= CURRENT_DATE
          AND d.valid_until >= CURRENT_DATE
          AND (
            d.product_name     ILIKE ${'%' + productQuery + '%'}
            OR d.normalized_name ILIKE ${'%' + productQuery + '%'}
          )
        ORDER BY s.slug, d.discount_percent DESC NULLS LAST
      `

      const lowestPrice =
        deals.length > 0 ? Math.min(...deals.map((d: any) => Number(d.dealPrice))) : null

      for (const sm of supermarkets) {
        const deal = deals.find((d: any) => d.supermarketSlug === sm.slug) ?? null
        cells[sm.slug] = {
          deal,
          isLowest: deal !== null && Number(deal.dealPrice) === lowestPrice,
        }
      }

      return { query: productQuery, cells, lowestPrice, highestSaving: null }
    })
  )

  return { rows, supermarkets }
}

// Format a Date as Dutch long date: "maandag 16 maart 2026"
function formatDutchDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function VergelijkPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const now = new Date()
  const week = getISOWeek(now)
  const year = getYear(now)
  const updatedLabel = formatDutchDate(now)

  const { rows, supermarkets } = await fetchCompareData(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Vergelijk prijzen{' '}
            <span className="text-xl font-normal text-muted-foreground">
              — week {week}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Zie per product welke supermarkt de laagste prijs heeft deze week.
          </p>
        </div>

        {/* Updated timestamp */}
        <p className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          Bijgewerkt:{' '}
          <span className="font-medium capitalize text-foreground">{updatedLabel}</span>
        </p>
      </div>

      {/* ── Table (client component for "Toon alle" toggle) ──── */}
      <VergelijkTable rows={rows} supermarkets={supermarkets} />
    </div>
  )
}
