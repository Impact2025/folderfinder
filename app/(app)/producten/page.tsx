import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ProductInput } from '@/components/product-input'
import sql from '@/lib/db'
import { Lightbulb } from 'lucide-react'
import type { UserProduct } from '@/types'

export const dynamic = 'force-dynamic'

const MAX_PRODUCTS = 15

async function fetchUserProducts(userId: string): Promise<UserProduct[]> {
  try {
    const rows = await sql`
      SELECT
        id,
        user_id      AS "userId",
        product_query AS "productQuery",
        sort_order   AS "sortOrder",
        created_at   AS "createdAt"
      FROM user_products
      WHERE user_id = ${userId}
      ORDER BY sort_order, created_at
    `
    return rows as UserProduct[]
  } catch {
    return []
  }
}

const TIPS = [
  {
    emoji: '🔤',
    text: (
      <>
        <strong>Gebruik generieke namen:</strong> typ{' '}
        <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">melk</span> in plaats van{' '}
        <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">AH halfvolle melk 1L</span>
      </>
    ),
  },
  {
    emoji: '🔀',
    text: (
      <>
        <strong>Voeg varianten toe:</strong> zet zowel{' '}
        <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">kipfilet</span> als{' '}
        <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">kipschnitzel</span> in je
        lijst voor meer resultaten
      </>
    ),
  },
  {
    emoji: '🌱',
    text: (
      <>
        <strong>Seizoensproducten:</strong> aardbeien zijn in de zomer veel goedkoper — pas je lijst
        aan per seizoen
      </>
    ),
  },
]

export default async function ProductenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const products = await fetchUserProducts(session.user.id)
  const count = products.length
  const pct = Math.round((count / MAX_PRODUCTS) * 100)

  // Progress bar color: green when full, orange when >10, blue otherwise
  const barColor =
    count >= MAX_PRODUCTS
      ? 'bg-emerald-500'
      : count > 10
        ? 'bg-amber-500'
        : 'bg-blue-500'

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mijn producten
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Voeg producten toe die je regelmatig koopt. Wij zoeken elke week automatisch de beste
          aanbiedingen bij alle supermarkten.
        </p>
      </div>

      {/* ── Progress bar ────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {count}{' '}
            <span className="text-muted-foreground">
              / {MAX_PRODUCTS} producten ingesteld
            </span>
          </span>
          {count >= MAX_PRODUCTS && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Lijst vol
            </span>
          )}
          {count > 10 && count < MAX_PRODUCTS && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Nog {MAX_PRODUCTS - count} plekken vrij
            </span>
          )}
        </div>

        {/* Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Product input + list ─────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <ProductInput initialProducts={products} maxProducts={MAX_PRODUCTS} />
      </div>

      {/* ── Tips card ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Lightbulb className="size-4" />
          </span>
          <h2 className="text-sm font-semibold">Tips voor betere resultaten</h2>
        </div>

        <ul className="flex flex-col gap-3">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
                {tip.emoji}
              </span>
              <span className="leading-relaxed">{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
