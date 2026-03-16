'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { GripVertical, Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserProduct } from '@/types'

interface ProductInputProps {
  initialProducts: UserProduct[]
  maxProducts: number
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
    if (
      products.some(
        (p) => p.productQuery.toLowerCase() === query.toLowerCase()
      )
    ) {
      toast.error('Dit product staat al in je lijst')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productQuery: query }),
        })
        if (!res.ok) throw new Error('Toevoegen mislukt')
        const data = await res.json()
        setProducts((prev) => [...prev, data.product])
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
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Verwijderen mislukt')
        setProducts((prev) => prev.filter((p) => p.id !== id))
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
      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {products.length}/{maxProducts} producten
        </span>
        {remaining <= 3 && remaining > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Nog {remaining} plek{remaining !== 1 ? 'ken' : ''} vrij
          </span>
        )}
        {remaining === 0 && (
          <span className="text-xs text-muted-foreground">Lijst vol</span>
        )}
      </div>

      {/* Add input */}
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
          className="gap-1.5 shrink-0"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Toevoegen
        </Button>
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          Nog geen producten. Voeg je eerste product toe hierboven.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {products.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Drag handle (visual only for now) */}
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/40 active:cursor-grabbing" />

              {/* Sort order */}
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground/50">
                {index + 1}
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
          ))}
        </ul>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Tip: gebruik generieke namen zoals &ldquo;kipfilet&rdquo; of &ldquo;havermout&rdquo; voor de beste resultaten.
      </p>
    </div>
  )
}
