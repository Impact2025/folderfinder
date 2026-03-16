/**
 * Discount calculation engine
 * Handles simple percentage deals AND complex Dutch supermarket labels
 */

export interface DiscountResult {
  discountPercent: number | null
  effectiveDiscountPercent: number | null
  normalizedPricePerUnit: number | null
  simplifiedLabel: string | null
}

/**
 * Calculate REAL discount percentage: (normalPrice - dealPrice) / normalPrice * 100
 */
export function calculateDiscountPercent(
  normalPrice: number | null | undefined,
  dealPrice: number
): number | null {
  if (!normalPrice || normalPrice <= dealPrice || normalPrice <= 0) return null
  const pct = ((normalPrice - dealPrice) / normalPrice) * 100
  return Math.round(pct * 10) / 10
}

/**
 * Parse complex Dutch deal labels into actionable discount info.
 * Examples: "1+1 gratis", "2e halve prijs", "3 voor €5.00", "20% korting"
 */
export function parseSpecialDeal(
  label: string | null | undefined,
  dealPrice: number,
  normalPrice: number | null | undefined
): DiscountResult {
  if (!label) {
    return {
      discountPercent: calculateDiscountPercent(normalPrice, dealPrice),
      effectiveDiscountPercent: calculateDiscountPercent(normalPrice, dealPrice),
      normalizedPricePerUnit: dealPrice,
      simplifiedLabel: null,
    }
  }

  const lower = label.toLowerCase().trim()

  // "1+1 gratis" / "2e gratis" / "1 + 1 free"
  if (/(1\+1|2e\s*gratis|een\s*gratis|buy\s*one\s*get\s*one)/i.test(lower)) {
    return {
      discountPercent: calculateDiscountPercent(normalPrice, dealPrice),
      effectiveDiscountPercent: 50,
      normalizedPricePerUnit: dealPrice / 2,
      simplifiedLabel: '1+1 gratis',
    }
  }

  // "2e halve prijs"
  if (/2e\s*halve\s*prijs/i.test(lower)) {
    return {
      discountPercent: calculateDiscountPercent(normalPrice, dealPrice),
      effectiveDiscountPercent: 25,
      normalizedPricePerUnit: dealPrice * 0.75,
      simplifiedLabel: '2e halve prijs',
    }
  }

  // "3e gratis" — buy 3, pay 2 → 33% off
  if (/3e\s*gratis/i.test(lower)) {
    return {
      discountPercent: calculateDiscountPercent(normalPrice, dealPrice),
      effectiveDiscountPercent: 33,
      normalizedPricePerUnit: (dealPrice * 2) / 3,
      simplifiedLabel: '3e gratis',
    }
  }

  // "X voor €Y.YY"
  const multiMatch = lower.match(/(\d+)\s+voor\s+[€]?\s*(\d+[.,]\d{2})/)
  if (multiMatch) {
    const qty = parseInt(multiMatch[1])
    const total = parseFloat(multiMatch[2].replace(',', '.'))
    const pricePerUnit = total / qty
    const effectivePct = normalPrice
      ? Math.round(((normalPrice - pricePerUnit) / normalPrice) * 1000) / 10
      : null
    return {
      discountPercent: calculateDiscountPercent(normalPrice, dealPrice),
      effectiveDiscountPercent: effectivePct,
      normalizedPricePerUnit: pricePerUnit,
      simplifiedLabel: label,
    }
  }

  // "X% korting" / "X% off"
  const pctMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*%/)
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1].replace(',', '.'))
    return {
      discountPercent: pct,
      effectiveDiscountPercent: pct,
      normalizedPricePerUnit: dealPrice,
      simplifiedLabel: `${pct}% korting`,
    }
  }

  // Fallback: use simple calculation
  return {
    discountPercent: calculateDiscountPercent(normalPrice, dealPrice),
    effectiveDiscountPercent: calculateDiscountPercent(normalPrice, dealPrice),
    normalizedPricePerUnit: dealPrice,
    simplifiedLabel: label,
  }
}

/**
 * Format price as Dutch locale string
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '–'
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(price)
}

/**
 * Get discount tier for UI coloring
 */
export function getDiscountTier(pct: number | null): 'none' | 'low' | 'medium' | 'high' | 'fire' {
  if (!pct) return 'none'
  if (pct < 15) return 'low'
  if (pct < 30) return 'medium'
  if (pct < 50) return 'high'
  return 'fire'
}
