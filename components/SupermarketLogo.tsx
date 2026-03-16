'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SupermarketLogoProps {
  slug: string
  name: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  xs: 'size-5 text-[9px]',
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-12 text-base',
}

/** Known supermarket brand colours override whatever is stored in the DB */
const BRAND_COLORS: Record<string, string> = {
  ah: '#00A0E2',
  'albert-heijn': '#00A0E2',
  jumbo: '#FFD700',
  lidl: '#0050AA',
  aldi: '#1E3A8A',
  plus: '#E8000D',
  coop: '#007A3D',
  dirk: '#E31B23',
  dekamarkt: '#004B97',
  hoogvliet: '#E8611A',
  spar: '#007A3D',
  vomar: '#D22030',
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    // Return first two chars for single-word names (e.g. "Jumbo" → "JU")
    return name.slice(0, 2).toUpperCase()
  }
  // First letter of each word, max 2
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function getTextColor(hex: string): string {
  // Parse hex to RGB and compute relative luminance
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff'
}

export function SupermarketLogo({
  slug,
  name,
  color,
  size = 'md',
}: SupermarketLogoProps) {
  const resolvedColor = BRAND_COLORS[slug.toLowerCase()] ?? color
  const initials = getInitials(name)
  const textColor = getTextColor(resolvedColor)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white/60 dark:ring-black/30 select-none cursor-default',
            sizeClasses[size]
          )}
          style={{ backgroundColor: resolvedColor, color: textColor }}
          aria-label={name}
        >
          {initials}
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{name}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
