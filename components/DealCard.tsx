'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart, ExternalLink, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

import { type Deal } from '@/types'
import { formatPrice, getDiscountTier } from '@/lib/discount'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DealCardProps {
  deal: Deal
  className?: string
}

// ---------------------------------------------------------------------------
// Discount badge (inline variant used only inside this card)
// ---------------------------------------------------------------------------

function DiscountCornerBadge({ percent }: { percent: number | null }) {
  if (percent == null || percent <= 0) return null

  const tier = getDiscountTier(percent)

  const variantClasses: Record<typeof tier, string> = {
    none: 'hidden',
    low: 'bg-green-500 text-white',
    medium: 'bg-amber-500 text-white',
    high: 'bg-orange-600 text-white',
    fire: 'bg-red-600 text-white shadow-lg shadow-red-500/40',
  }

  const badge = (
    <div
      className={cn(
        'absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold leading-none',
        variantClasses[tier]
      )}
    >
      <span>-{Math.round(percent)}%</span>
      {tier === 'fire' && <span>🔥</span>}
    </div>
  )

  if (tier === 'fire') {
    return (
      <motion.div
        className="absolute top-2 right-2 z-10"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold leading-none',
            variantClasses[tier]
          )}
        >
          <span>-{Math.round(percent)}%</span>
          <span>🔥</span>
        </div>
      </motion.div>
    )
  }

  return badge
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DealCard({ deal, className }: DealCardProps) {
  const validUntilFormatted = (() => {
    try {
      return format(parseISO(deal.validUntil), 'd MMM', { locale: nl })
    } catch {
      return deal.validUntil
    }
  })()

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn('group', className)}
    >
      <Card className="relative flex h-full flex-col overflow-hidden border-border/60 bg-card transition-shadow duration-200 hover:shadow-md dark:hover:shadow-black/30">
        {/* Discount badge — top-right corner */}
        <DiscountCornerBadge percent={deal.discountPercent} />

        {/* Product image */}
        <div className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-muted/40 p-3">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={deal.productName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <ShoppingCart className="size-12 text-muted-foreground/40" />
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {/* Supermarket row */}
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: deal.supermarketColor || '#94a3b8' }}
            />
            <span className="truncate text-xs font-medium text-muted-foreground">
              {deal.supermarketName}
            </span>
          </div>

          {/* Product name */}
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {deal.productName}
          </p>

          {/* Brand */}
          {deal.brand && (
            <p className="truncate text-xs text-muted-foreground">{deal.brand}</p>
          )}

          {/* Pricing */}
          <div className="mt-auto flex flex-col gap-0.5 pt-1">
            {deal.normalPrice != null && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(deal.normalPrice)}
              </span>
            )}

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                {formatPrice(deal.dealPrice)}
              </span>
              {deal.unitSize && (
                <span className="text-xs text-muted-foreground">{deal.unitSize}</span>
              )}
            </div>

            {/* Discount label (e.g. "1+1 gratis") */}
            {deal.discountLabel && (
              <Badge
                variant="secondary"
                className="mt-0.5 w-fit text-xs font-medium"
              >
                {deal.discountLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3" />
            <span>Geldig t/m {validUntilFormatted}</span>
          </div>
          <ExternalLink className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  )
}
