'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getDiscountTier } from '@/lib/discount'

interface DiscountBadgeProps {
  percent: number | null
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-0.5',
  md: 'text-sm px-2 py-0.5 gap-1',
  lg: 'text-base px-3 py-1 gap-1 font-bold',
}

const tierClasses = {
  none: 'bg-muted text-muted-foreground border border-border',
  low: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  medium: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  high: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  fire: 'bg-red-600 text-white border border-red-700 shadow-sm shadow-red-500/30',
}

export function DiscountBadge({ percent, label, size = 'md' }: DiscountBadgeProps) {
  const tier = getDiscountTier(percent)

  // Nothing to show
  if (percent == null && !label) return null

  const baseClasses = cn(
    'inline-flex items-center rounded-md font-semibold leading-none',
    sizeClasses[size],
    tierClasses[tier]
  )

  const content = (
    <>
      {percent != null ? (
        <>
          <span>-{Math.round(percent)}%</span>
          {tier === 'fire' && <span>🔥</span>}
        </>
      ) : (
        <span>{label}</span>
      )}
    </>
  )

  if (tier === 'fire') {
    return (
      <motion.div
        className={baseClasses}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {content}
      </motion.div>
    )
  }

  return <div className={baseClasses}>{content}</div>
}
