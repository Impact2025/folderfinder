import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getISOWeek, getYear, format, parseISO, startOfISOWeek, endOfISOWeek, addDays } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  PackagePlus,
  Percent,
  Store,
  Ticket,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MatchedGroup, Deal } from '@/types'

export const dynamic = 'force-dynamic'

// ─── WeekBadge ────────────────────────────────────────────────────────────────

function WeekBadge() {
  const now = new Date()
  const week = getISOWeek(now)
  const year = getYear(now)
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

  return (
    <div className="deal-card flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Supermarket + discount */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: deal.supermarketColor }}
          />
          <span className="text-xs text-muted-foreground">
            {deal.supermarketName}
          </span>
        </div>
        {discount > 0 && (
          <span
            className="discount-fire rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: deal.supermarketColor }}
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* Product name */}
      <div>
        <p className="font-semibold leading-snug text-foreground">
          {deal.productName}
        </p>
        {deal.brand && (
          <p className="text-xs text-muted-foreground">{deal.brand}</p>
        )}
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold">
            €{deal.dealPrice.toFixed(2)}
          </span>
          {deal.normalPrice != null && (
            <span className="text-sm text-muted-foreground line-through">
              €{deal.normalPrice.toFixed(2)}
            </span>
          )}
        </div>
        {deal.discountLabel && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {deal.discountLabel}
          </span>
        )}
      </div>

      {/* Unit size */}
      {deal.unitSize && (
        <p className="text-xs text-muted-foreground">{deal.unitSize}</p>
      )}
    </div>
  )
}

// ─── ProductMatchGrid ─────────────────────────────────────────────────────────

function ProductMatchGrid({ groups }: { groups: MatchedGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.query}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold capitalize text-foreground">
              {group.query}
            </h2>
            <span className="text-xs text-muted-foreground">
              {group.deals.length} deal{group.deals.length !== 1 ? 's' : ''}
            </span>
          </div>

          {group.deals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
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
      ))}
    </div>
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
    },
    {
      icon: TrendingDown,
      label: 'Beste korting',
      value: bestDiscount > 0 ? `${bestDiscount}%` : '—',
    },
    {
      icon: Store,
      label: 'Supermarkten',
      value: supermarkets.toString(),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="size-3.5" />
              <span className="text-xs">{stat.label}</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

async function fetchMatches(userId: string): Promise<MatchedGroup[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/matches`, {
      headers: { 'x-user-id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.groups ?? []
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const groups = await fetchMatches(session.user.id)
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
