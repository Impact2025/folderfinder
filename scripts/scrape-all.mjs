#!/usr/bin/env node
/**
 * Standalone scrape runner — called by GitHub Actions every Monday
 * Usage: DATABASE_URL=... APIFY_API_TOKEN=... node scripts/scrape-all.mjs
 */

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Enable TypeScript/ESM support via tsx if available
try {
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)

  // Try to use tsx for TypeScript support
  process.env.NODE_OPTIONS = '--experimental-vm-modules'

  const { runAllScrapers } = await import('../scrapers/index.ts')
  await runAllScrapers()
  process.exit(0)
} catch (err) {
  console.error('Scraper failed:', err)
  process.exit(1)
}
