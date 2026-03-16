import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getISOWeek, getYear, format, startOfISOWeek, endOfISOWeek } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  PackagePlus,
  Store,
  Ticket,
  ArrowRight,
  TrendingDown,
  Trophy,
  Leaf,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import sql from '@/lib/db'
import type { MatchedGroup, Deal } from '@/types'

export const dynamic = 'force-dynamic'

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchMatches(userId: string): Promise<MatchedGroup[]> {
  const rows = await sql`
    SELECT product_query AS "productQuery", sort_order AS "sortOrder"
    FROM user_products WHERE user_id = ${userId} ORDER BY sort_order, created_at
  `
  if (rows.length === 0) return []

  const groups = await Promise.all(
    (rows as Array<{ productQuery: string; sortOrder: number }>).map(
      async ({ productQuery, sortOrder }) => {
        const deals = await sql`
          SELECT
            d.id,
            d.supermarket_id  AS "supermarketId",
            s.name            AS "supermarketName",
            s.slug            AS "supermarketSlug",
            s.color           AS "supermarketColor",
            d.product_name    AS "productName",
            d.brand,
            d.normal_price    AS "normalPrice",
            d.deal_price      AS "dealPrice",
            d.discount_percent AS "discountPercent",
            d.discount_label  AS "discountLabel",
            d.unit_size       AS "unitSize",
            d.image_url       AS "imageUrl",
            d.valid_from      AS "validFrom",
            d.valid_until     AS "validUntil",
            d.barcode
          FROM deals d
          JOIN supermarkets s ON s.id = d.supermarket_id
          WHERE
            d.valid_from <= CURRENT_DATE
            AND d.valid_until >= CURRENT_DATE
            AND (
              d.product_name ILIKE ${'%' + productQuery + '%'}
              OR d.normalized_name ILIKE ${'%' + productQuery + '%'}
            )
          ORDER BY d.discount_percent DESC NULLS LAST
          LIMIT 10
        `
        const dealsArr = deals as Deal[]
        const bestDeal = dealsArr[0] ?? null
        return { query: productQuery, sortOrder, deals: dealsArr, bestDeal }
      }
    )
  )
  return groups.sort((a, b) => a.sortOrder - b.sortOrder)
}

async function fetchTop15(): Promise<Deal[]> {
  const rows = await sql`
    SELECT
      d.id,
      d.supermarket_id  AS "supermarketId",
      s.name            AS "supermarketName",
      s.slug            AS "supermarketSlug",
      s.color           AS "supermarketColor",
      d.product_name    AS "productName",
      d.brand,
      d.normal_price    AS "normalPrice",
      d.deal_price      AS "dealPrice",
      d.discount_percent AS "discountPercent",
      d.discount_label  AS "discountLabel",
      d.unit_size       AS "unitSize",
      d.image_url       AS "imageUrl",
      d.valid_from      AS "validFrom",
      d.valid_until     AS "validUntil",
      d.barcode
    FROM deals d
    JOIN supermarkets s ON s.id = d.supermarket_id
    WHERE
      d.valid_from <= CURRENT_DATE
      AND d.valid_until >= CURRENT_DATE
      AND d.discount_percent IS NOT NULL
    ORDER BY d.discount_percent DESC
    LIMIT 15
  `
  return rows as Deal[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isBio(deal: Deal): boolean {
  const hay = `${deal.productName} ${deal.category ?? ''} ${deal.brand ?? ''}`.toLowerCase()
  return /\bbio(logisch)?\b/.test(hay)
}

function discountTier(pct: number): 'high' | 'mid' | 'low' {
  if (pct > 35) return 'high'
  if (pct >= 20) return 'mid'
  return 'low'
}

function formatPrice(p: number | string): string {
  return `€${Number(p).toFixed(2)}`
}

// ─── WeekBadge ────────────────────────────────────────────────────────────────

function WeekBadge() {
  const now = new Date()
  const week = getISOWeek(now)
  const weekStart = startOfISOWeek(now)
  const weekEnd = endOfISOWeek(now)

  const startDay = format(weekStart, 'd', { locale: nl })
  const endDay = format(weekEnd, 'd', { locale: nl })
  const month = format(weekEnd, 'MMMM yyyy', { locale: nl })

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
      <Ticket className="size-3" />
      Week {week} &bull; {startDay}&ndash;{endDay} {month}
    </div>
  )
}

// ─── DealCard ─────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const discount = deal.discountPercent ?? 0
  const tier = discountTier(discount)

  const badgeCls =
    tier === 'high'
      ? 'bg-red-500 text-white'
      : tier === 'mid'
        ? 'bg-orange-500 text-white'
        : 'bg-muted text-muted-foreground'

  const savings =
    deal.normalPrice != null && deal.dealPrice != null
      ? Number(deal.normalPrice) - Number(deal.dealPrice)
      : null

  const pillStyle = deal.supermarketColor
    ? {
        backgroundColor: `${deal.supermarketColor}22`,
        color: deal.supermarketColor,
      }
    : undefined

  return (
    <div className="deal-card flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card">
      {/* Top row: supermarket dot + name | discount badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: deal.supermarketColor }}
          />
          <span className="truncate text-xs font-medium text-muted-foreground">
            {deal.supermarketName}
          </span>
        </div>
        {discount > 0 && (
          <span
            className={`discount-fire shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeCls}`}
          >
            -{discount}%{tier === 'high' ? ' 🔥' : ''}
          </span>
        )}
      </div>

      {/* Product name — 2-line clamp */}
      <div>
        <p className="line-clamp-2 font-semibold leading-snug text-foreground">
          {deal.productName}
        </p>
        {deal.brand && (
          <p className="mt-0.5 text-xs text-muted-foreground">{deal.brand}</p>
        )}
      </div>

      {/* Price row */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-foreground">
            {formatPrice(deal.dealPrice)}
          </span>
          {deal.normalPrice != null && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(deal.normalPrice)}
            </span>
          )}
        </div>
        {savings != null && savings > 0.005 && (
          <span className="shrink-0 text-xs font-semibold text-green-600">
            Bespaar {formatPrice(savings)}
          </span>
        )}
      </div>

      {/* Discount label pill */}
      {deal.discountLabel && (
        <span
          className="w-fit rounded-full px-2 py-0.5 text-xs font-medium"
          style={pillStyle}
        >
          {deal.discountLabel}
        </span>
      )}

      {/* Footer: unit size + valid until */}
      {(deal.unitSize || deal.validUntil) && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          {deal.unitSize ? (
            <span className="text-xs text-muted-foreground">{deal.unitSize}</span>
          ) : (
            <span />
          )}
          {deal.validUntil && (
            <span className="text-xs text-muted-foreground">
              t/m{' '}
              {format(new Date(deal.validUntil), 'd MMM', { locale: nl })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Top15Section ─────────────────────────────────────────────────────────────

function Top15Section({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-amber-500" />
        <h2 className="text-base font-semibold text-foreground">
          Top 15 aanbiedingen deze week
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {deals.map((deal, i) => {
          const bio = isBio(deal)
          const discount = deal.discountPercent ?? 0
          const tier = discountTier(discount)
          const badgeCls =
            tier === 'high'
              ? 'bg-red-500 text-white'
              : tier === 'mid'
                ? 'bg-orange-500 text-white'
                : 'bg-muted text-muted-foreground'
          const savings =
            deal.normalPrice != null
              ? Number(deal.normalPrice) - Number(deal.dealPrice)
              : null

          return (
            <div
              key={deal.id}
              className="deal-card relative flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-card"
            >
              {/* Rank badge */}
              <span className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow">
                {i + 1}
              </span>

              {/* Supermarket + badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: deal.supermarketColor }}
                  />
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {deal.supermarketName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {bio && (
                    <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                      <Leaf className="size-2.5" />
                      bio
                    </span>
                  )}
                  {discount > 0 && (
                    <span
                      className={`discount-fire rounded-full px-2 py-0.5 text-xs font-bold ${badgeCls}`}
                    >
                      -{discount}%{tier === 'high' ? ' 🔥' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Product name */}
              <div>
                <p className="line-clamp-2 font-semibold leading-snug text-foreground">
                  {deal.productName}
                </p>
                {deal.brand && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{deal.brand}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(deal.dealPrice)}
                </span>
                {deal.normalPrice != null && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(deal.normalPrice)}
                  </span>
                )}
              </div>

              {savings != null && savings > 0.005 && (
                <span className="text-xs font-semibold text-green-600">
                  Bespaar {formatPrice(savings)}
                </span>
              )}

              {deal.unitSize && (
                <p className="text-xs text-muted-foreground">{deal.unitSize}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── SummaryStats ─────────────────────────────────────────────────────────────

function SummaryStats({ groups }: { groups: MatchedGroup[] }) {
  const allDeals = groups.flatMap((g) => g.deals)
  const totalDeals = allDeals.length
  const bestDiscount = allDeals.reduce(
    (max, d) => Math.max(max, d.discountPercent ?? 0),
    0
  )
  const supermarkets = new Set(allDeals.map((d) => d.supermarketSlug)).size

  const stats = [
    {
      icon: Ticket,
      label: 'Aanbiedingen gevonden',
      value: totalDeals.toString(),
      iconCls: 'text-blue-500',
      gradientCls: 'from-blue-50 to-white dark:from-blue-950/30 dark:to-card',
    },
    {
      icon: TrendingDown,
      label: 'Beste korting',
      value: bestDiscount > 0 ? `${bestDiscount}%` : '—',
      iconCls: 'text-green-500',
      gradientCls: 'from-green-50 to-white dark:from-green-950/30 dark:to-card',
    },
    {
      icon: Store,
      label: 'Supermarkten',
      value: supermarkets.toString(),
      iconCls: 'text-purple-500',
      gradientCls: 'from-purple-50 to-white dark:from-purple-950/30 dark:to-card',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`flex flex-col gap-1 rounded-2xl border border-border bg-gradient-to-br p-4 shadow-sm ${stat.gradientCls}`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={`size-3.5 ${stat.iconCls}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── ProductMatchGrid ─────────────────────────────────────────────────────────

function ProductMatchGrid({ groups }: { groups: MatchedGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => {
        const best = group.bestDeal
        return (
          <section key={group.query}>
            {/* Section header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="truncate text-base font-bold capitalize text-foreground">
                  {group.query}
                </h2>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {group.deals.length} deal{group.deals.length !== 1 ? 's' : ''}
                </span>
              </div>
              {best && (
                <p className="shrink-0 text-xs text-muted-foreground">
                  Beste deal:{' '}
                  <span className="font-semibold text-foreground">
                    {formatPrice(best.dealPrice)}
                  </span>{' '}
                  bij{' '}
                  <span
                    className="font-semibold"
                    style={{ color: best.supermarketColor }}
                  >
                    {best.supermarketName}
                  </span>
                </p>
              )}
            </div>

            {group.deals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                Geen aanbiedingen gevonden deze week
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [groups, top15] = await Promise.all([
    fetchMatches(session.user.id),
    fetchTop15(),
  ])
  const hasProducts = groups.length > 0

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <WeekBadge />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Jouw aanbiedingen
          </h1>
        </div>
      </div>

      {/* Top 15 — always visible */}
      <Top15Section deals={top15} />

      {/* Onboarding state */}
      {!hasProducts ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PackagePlus className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold">
              Stel je top 15 producten in
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Voeg producten toe die je regelmatig koopt. Wij zoeken elke week de
              beste aanbiedingen voor je.
            </p>
          </div>
          <Link href="/producten">
            <Button className="gap-2">
              Producten instellen
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <SummaryStats groups={groups} />
          <ProductMatchGrid groups={groups} />
        </>
      )}
    </div>
  )
}
