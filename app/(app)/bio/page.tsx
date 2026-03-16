import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getISOWeek } from 'date-fns'
import { Leaf, TrendingDown, ShoppingBasket, Sparkles } from 'lucide-react'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

interface BioDeal {
  id: number
  supermarketName: string
  supermarketSlug: string
  supermarketColor: string
  productName: string
  brand: string | null
  category: string | null
  normalPrice: number | null
  dealPrice: number
  discountPercent: number | null
  discountLabel: string | null
  unitSize: string | null
  validUntil: string
}

async function fetchBioDeals(): Promise<BioDeal[]> {
  const rows = await sql`
    SELECT
      d.id,
      s.name            AS "supermarketName",
      s.slug            AS "supermarketSlug",
      s.color           AS "supermarketColor",
      d.product_name    AS "productName",
      d.brand,
      d.category,
      d.normal_price    AS "normalPrice",
      d.deal_price      AS "dealPrice",
      d.discount_percent AS "discountPercent",
      d.discount_label  AS "discountLabel",
      d.unit_size       AS "unitSize",
      d.valid_until     AS "validUntil"
    FROM deals d
    JOIN supermarkets s ON s.id = d.supermarket_id
    WHERE
      d.valid_from  <= CURRENT_DATE
      AND d.valid_until >= CURRENT_DATE
      AND s.is_active = true
      AND (
        d.product_name    ILIKE '%bio%'
        OR d.normalized_name ILIKE '%bio%'
        OR d.brand        ILIKE '%bio%'
        OR d.category     ILIKE '%bio%'
      )
    ORDER BY d.discount_percent DESC NULLS LAST
    LIMIT 15
  `
  return rows as BioDeal[]
}

function discountTier(pct: number | null): { badge: string; glow: string } {
  if (!pct || pct < 20) return { badge: 'bg-gray-100 text-gray-700', glow: '' }
  if (pct < 35) return { badge: 'bg-orange-100 text-orange-700', glow: '' }
  if (pct < 50) return { badge: 'bg-red-100 text-red-700', glow: '' }
  return { badge: 'bg-red-500 text-white discount-fire', glow: 'ring-2 ring-red-200' }
}

function BioDealCard({ deal, rank }: { deal: BioDeal; rank: number }) {
  const pct = Number(deal.discountPercent ?? 0)
  const { badge, glow } = discountTier(deal.discountPercent)
  const saving = deal.normalPrice ? Number(deal.normalPrice) - Number(deal.dealPrice) : null
  const isFireDeal = pct >= 50

  return (
    <div className={`deal-card relative flex flex-col gap-3 rounded-2xl border border-border bg-white dark:bg-card p-4 shadow-sm ${glow}`}>
      {/* Rank */}
      <span className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white shadow">
        {rank}
      </span>

      {/* Header: supermarket + discount */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2 shrink-0 rounded-full" style={{ backgroundColor: deal.supermarketColor }} />
          <span className="text-xs font-medium text-muted-foreground">{deal.supermarketName}</span>
        </div>
        {pct > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>
            {isFireDeal ? '🔥 ' : ''}-{pct}%
          </span>
        )}
      </div>

      {/* Bio badge + category */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
          <Leaf className="size-3" />
          Bio
        </span>
        {deal.category && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {deal.category}
          </span>
        )}
      </div>

      {/* Product name */}
      <p className="line-clamp-2 font-semibold leading-snug text-foreground">
        {deal.productName}
      </p>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-foreground">
            €{Number(deal.dealPrice).toFixed(2)}
          </span>
          {deal.normalPrice != null && (
            <span className="text-sm text-muted-foreground line-through">
              €{Number(deal.normalPrice).toFixed(2)}
            </span>
          )}
        </div>
        {saving && saving > 0.01 && (
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
            Bespaar €{saving.toFixed(2)}
          </span>
        )}
      </div>

      {/* Footer */}
      {(deal.unitSize || deal.discountLabel) && (
        <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
          <span>{deal.unitSize ?? ''}</span>
          {deal.discountLabel && (
            <span
              className="rounded-md px-1.5 py-0.5 font-medium"
              style={{ backgroundColor: deal.supermarketColor + '22', color: deal.supermarketColor }}
            >
              {deal.discountLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function StatsBar({ deals }: { deals: BioDeal[] }) {
  const best = Math.max(...deals.map(d => Number(d.discountPercent ?? 0)))
  const supers = new Set(deals.map(d => d.supermarketSlug)).size
  const avgSaving = deals
    .filter(d => d.normalPrice)
    .reduce((sum, d) => sum + (Number(d.normalPrice) - Number(d.dealPrice)), 0) / deals.length

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { icon: Leaf, label: 'Bio deals', value: deals.length.toString(), color: 'text-green-500', bg: 'from-green-50 to-white dark:from-green-950/20 dark:to-card' },
        { icon: TrendingDown, label: 'Beste korting', value: `${best}%`, color: 'text-red-500', bg: 'from-red-50 to-white dark:from-red-950/20 dark:to-card' },
        { icon: ShoppingBasket, label: 'Supermarkten', value: supers.toString(), color: 'text-blue-500', bg: 'from-blue-50 to-white dark:from-blue-950/20 dark:to-card' },
      ].map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className={`flex flex-col gap-1 rounded-xl border border-border bg-gradient-to-br ${bg} p-4 shadow-sm`}>
          <div className={`flex items-center gap-1.5 ${color}`}>
            <Icon className="size-3.5" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">{value}</span>
        </div>
      ))}
    </div>
  )
}

export default async function BioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const deals = await fetchBioDeals()
  const week = getISOWeek(new Date())

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
            <Leaf className="size-3.5" />
            Biologisch
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3" />
            Week {week}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Top 15 bio aanbiedingen
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          De beste kortingen op biologische producten deze week — gesorteerd op hoogste korting.
        </p>
      </div>

      {/* Stats */}
      {deals.length > 0 && <StatsBar deals={deals} />}

      {/* Grid */}
      {deals.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Leaf className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold">Geen bio aanbiedingen gevonden</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Wij zoeken elke week automatisch naar biologische producten in de aanbiedingen.
              Kom volgende week terug!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {deals.map((deal, i) => (
            <BioDealCard key={deal.id} deal={deal} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        Bio producten herkend op naam, merk of categorie &bull; Prijzen kunnen afwijken per locatie
      </p>
    </div>
  )
}
