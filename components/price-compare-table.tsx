'use client'

import Link from 'next/link'
import { ArrowRight, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompareRow } from '@/types'

interface PriceCompareTableProps {
  rows: CompareRow[]
  supermarkets: Array<{ slug: string; name: string; color: string }>
}

export function PriceCompareTable({ rows, supermarkets }: PriceCompareTableProps) {
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

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Product
            </th>
            {supermarkets.map((sm) => (
              <th
                key={sm.slug}
                className="px-4 py-3 text-center font-medium text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="h-1 w-6 rounded-full"
                    style={{ backgroundColor: sm.color }}
                  />
                  <span>{sm.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.query}
              className="bg-card transition-colors hover:bg-muted/20"
            >
              {/* Product query */}
              <td className="px-4 py-3 font-medium capitalize text-foreground">
                {row.query}
              </td>

              {/* Cells per supermarket */}
              {supermarkets.map((sm) => {
                const cell = row.cells[sm.slug]
                if (!cell || !cell.deal) {
                  return (
                    <td
                      key={sm.slug}
                      className="px-4 py-3 text-center text-muted-foreground/40"
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
                      'px-4 py-3 text-center',
                      isLowest && 'bg-emerald-50 dark:bg-emerald-950/20'
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          isLowest
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-foreground'
                        )}
                      >
                        €{deal.dealPrice.toFixed(2)}
                      </span>
                      {deal.normalPrice != null && (
                        <span className="text-xs text-muted-foreground line-through tabular-nums">
                          €{deal.normalPrice.toFixed(2)}
                        </span>
                      )}
                      {deal.discountPercent != null && deal.discountPercent > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-xs font-medium text-white',
                            isLowest ? 'opacity-100' : 'opacity-80'
                          )}
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
  )
}
