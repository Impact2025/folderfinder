/**
 * Product name normalization for cross-supermarket matching
 */

// Common Dutch supermarket brand prefixes to strip for matching
const BRAND_STRIP = [
  'ah ', 'albert heijn ', 'jumbo ', 'dirk ', 'plus ', 'lidl ', 'aldi ',
  'ah biologisch ', 'ah excellent ', 'ah terra ',
]

// Unit normalization map
const UNIT_MAP: Record<string, string> = {
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilo: 'kg',
  liter: 'l',
  litre: 'l',
  milliliter: 'ml',
  stuks: 'st',
  stuk: 'st',
  pak: 'pak',
  blik: 'blik',
}

export function normalizeProductName(name: string): string {
  let n = name.toLowerCase().trim()

  // Strip HTML tags
  n = n.replace(/<[^>]+>/g, '')

  // Strip brand prefixes
  for (const brand of BRAND_STRIP) {
    if (n.startsWith(brand)) {
      n = n.slice(brand.length)
    }
  }

  // Normalize units
  for (const [from, to] of Object.entries(UNIT_MAP)) {
    n = n.replace(new RegExp(`\\b${from}\\b`, 'gi'), to)
  }

  // Remove special chars except dash and space
  n = n.replace(/[^a-z0-9\s\-]/g, ' ')

  // Collapse whitespace
  n = n.replace(/\s+/g, ' ').trim()

  return n
}

/**
 * Extract unit size from product name, e.g. "Melk 1L" → { name: "Melk", unitSize: "1L" }
 */
export function extractUnitSize(name: string): { cleanName: string; unitSize: string | null } {
  const unitPattern = /\b(\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|cl|st|stuks|pak|blik|x)(?:\s*\d+)?)\b/i
  const match = name.match(unitPattern)

  if (match) {
    const cleanName = name.replace(match[0], '').replace(/\s+/g, ' ').trim()
    return { cleanName, unitSize: match[0].trim() }
  }

  return { cleanName: name, unitSize: null }
}

/**
 * Compute price per 100g/100ml for fair comparison
 */
export function computePricePerUnit(
  price: number,
  unitSize: string | null
): number | null {
  if (!unitSize) return null

  const gramMatch = unitSize.match(/(\d+(?:[.,]\d+)?)\s*g\b/i)
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1].replace(',', '.'))
    return grams > 0 ? (price / grams) * 100 : null
  }

  const kgMatch = unitSize.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i)
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1].replace(',', '.'))
    return kg > 0 ? (price / kg) / 10 : null
  }

  const mlMatch = unitSize.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i)
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1].replace(',', '.'))
    return ml > 0 ? (price / ml) * 100 : null
  }

  const lMatch = unitSize.match(/(\d+(?:[.,]\d+)?)\s*l\b/i)
  if (lMatch) {
    const l = parseFloat(lMatch[1].replace(',', '.'))
    return l > 0 ? (price / l) / 10 : null
  }

  return null
}

/**
 * Get ISO week number for a date
 */
export function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}
