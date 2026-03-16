'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserProduct } from '@/types'

interface ProductInputProps {
  initialProducts: UserProduct[]
  maxProducts: number
}

/** A small set of pastel background + text color pairs for the avatar circles. */
const AVATAR_PALETTES = [
  { bg: 'bg-blue-100 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-violet-100 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/50', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
  { bg: 'bg-lime-100 dark:bg-lime-950/50', text: 'text-lime-700 dark:text-lime-300' },
]

function palette(index: number) {
  return AVATAR_PALETTES[index % AVATAR_PALETTES.length]
}

export function ProductInput({ initialProducts, maxProducts }: ProductInputProps) {
  const [products, setProducts] = useState<UserProduct[]>(initialProducts)
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const remaining = maxProducts - products.length

  const handleAdd = useCallback(() => {
    const query = inputValue.trim()
    if (!query) return
    if (products.length >= maxProducts) {
      toast.error(`Je kunt maximaal ${maxProducts} producten toevoegen`)
      return
    }
    if (products.some((p) => p.productQuery.toLowerCase() === query.toLowerCase())) {
      toast.error('Dit product staat al in je lijst')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/user/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productQuery: query }),
        })
        if (!res.ok) throw new Error('Toevoegen mislukt')
        const data = await res.json()
        setProducts(data.products ?? [])
        setInputValue('')
        inputRef.current?.focus()
        toast.success(`"${query}" toegevoegd`)
      } catch {
        toast.error('Er ging iets mis bij het toevoegen')
      }
    })
  }, [inputValue, products, maxProducts])

  const handleDelete = useCallback((id: number, query: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/user/products/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Verwijderen mislukt')
        const data = await res.json()
        setProducts(data.products ?? [])
        toast.success(`"${query}" verwijderd`)
      } catch {
        toast.error('Er ging iets mis bij het verwijderen')
      }
    })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Add input ──────────────────────────────────────── */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="bijv. kipfilet, halfvolle melk, volkoren brood…"
          disabled={products.length >= maxProducts || isPending}
          className={cn(
            'h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors'
          )}
        />
        <Button
          onClick={handleAdd}
          disabled={!inputValue.trim() || products.length >= maxProducts || isPending}
          size="default"
          className="shrink-0 gap-1.5"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Toevoegen
        </Button>
      </div>

      {/* Remaining hint */}
      {remaining <= 3 && remaining > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Nog {remaining} plek{remaining !== 1 ? 'ken' : ''} vrij
        </p>
      )}

      {/* ── Product list ───────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          Nog geen producten. Voeg je eerste product toe hierboven.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
          {products.map((product, index) => {
            const { bg, text } = palette(index)
            const initial = product.productQuery.charAt(0).toUpperCase()

            return (
              <li
                key={product.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                {/* Colored-circle avatar */}
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase',
                    bg,
                    text
                  )}
                  aria-hidden
                >
                  {initial}
                </span>

                {/* Product name */}
                <span className="flex-1 text-sm font-medium capitalize">
                  {product.productQuery}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(product.id, product.productQuery)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none"
                  aria-label={`${product.productQuery} verwijderen`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
