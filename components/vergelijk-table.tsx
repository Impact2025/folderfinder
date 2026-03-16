'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompareRow } from '@/types'

interface VergelijkTableProps {
  rows: CompareRow[]
  supermarkets: Array<{ slug: string; name: string; color: string }>
}

const TOP_N = 5

export function VergelijkTable({ rows, supermarkets }: VergelijkTableProps) {
  const [showAll, setShowAll] = useState(false)

  /* ── Empty state ──────────────────────────────────────────── */
  if (rows.length === 0 || supermarkets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <TrendingDown className="size-6" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold">Geen vergelijkingsdata</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Voeg eerst producten toe om prijzen te vergelijken.
          </p>
        </div>
        <Link
          href="/producten"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Producten instellen
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    )
  }

  /* On mobile (small screens) we default to the first TOP_N supermarkets.
     The parent page passes all supermarkets; showAll controls whether we
     slice or show everything. */
  const visibleSupermarkets =
    !showAll && supermarkets.length > TOP_N ? supermarkets.slice(0, TOP_N) : supermarkets

  const hasHidden = supermarkets.length > TOP_N

  return (
    <div className="flex flex-col gap-3">
      {/* ── Scroll wrapper + table ──────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          {/* ── Head ──────────────────────────────────────────── */}
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {/* Sticky product-name column */}
              <th
                className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
                style={{ minWidth: '160px' }}
              >
                Product
              </th>

              {visibleSupermarkets.map((sm) => (
                <th
                  key={sm.slug}
                  className="px-4 py-0 text-center font-medium text-muted-foreground"
                  style={{ minWidth: '108px' }}
                >
                  {/* Colored top border strip */}
                  <div
                    className="mx-auto mb-2 mt-0 h-1 w-full rounded-b-full"
                    style={{ backgroundColor: sm.color }}
                  />
                  <span className="block pb-3 text-xs font-semibold uppercase tracking-wider">
                    {sm.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ──────────────────────────────────────────── */}
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row.query}
                className="group bg-card transition-colors hover:bg-muted/20"
              >
                {/* Sticky product cell */}
                <td
                  className="sticky left-0 z-10 bg-card px-4 py-3.5 font-semibold capitalize text-foreground backdrop-blur-sm group-hover:bg-muted/20"
                  style={{ minWidth: '160px' }}
                >
                  {row.query}
                </td>

                {/* Per-supermarket cells */}
                {visibleSupermarkets.map((sm) => {
                  const cell = row.cells[sm.slug]

                  /* No deal */
                  if (!cell || !cell.deal) {
                    return (
                      <td
                        key={sm.slug}
                        className="px-4 py-3.5 text-center text-muted-foreground/30"
                      >
                        —
                      </td>
                    )
                  }

                  const { deal, isLowest } = cell

                  return (
                    <td
                      key={sm.slug}
                      className={cn(
                        'px-4 py-3.5 text-center',
                        isLowest
                          ? 'bg-emerald-50 dark:bg-emerald-950/20'
                          : ''
                      )}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {/* Price + optional checkmark for lowest */}
                        <div className="flex items-center gap-1">
                          {isLowest && (
                            <Check
                              className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                              strokeWidth={3}
                            />
                          )}
                          <span
                            className={cn(
                              'font-bold tabular-nums',
                              isLowest
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-foreground'
                            )}
                          >
                            €{Number(deal.dealPrice).toFixed(2)}
                          </span>
                        </div>

                        {/* Strikethrough normal price */}
                        {deal.normalPrice != null && (
                          <span className="text-xs tabular-nums text-muted-foreground line-through">
                            €{Number(deal.normalPrice).toFixed(2)}
                          </span>
                        )}

                        {/* Discount badge */}
                        {deal.discountPercent != null && deal.discountPercent > 0 && (
                          <span
                            className="mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none text-white"
                            style={{ backgroundColor: sm.color }}
                          >
                            -{deal.discountPercent}%
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── "Toon alle" toggle (only shown when there are hidden columns) ── */}
      {hasHidden && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            {showAll
              ? `Toon minder (top ${TOP_N})`
              : `Toon alle ${supermarkets.length} supermarkten`}
          </button>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded-sm bg-emerald-50 dark:bg-emerald-950/20">
            <Check className="size-2.5 text-emerald-600" strokeWidth={3} />
          </span>
          Laagste prijs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 text-center text-muted-foreground/30">—</span>
          Geen aanbieding gevonden
        </span>
      </div>
    </div>
  )
}
