#!/usr/bin/env node
/**
 * Database migration script
 * Usage: node scripts/db-migrate.mjs
 * Requires DATABASE_URL in environment or .env.local
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load .env.local if running locally
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: resolve(__dirname, '../.env.local') })
} catch {}

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  await client.connect()
  console.log('✅ Connected to database')

  const schemaPath = resolve(__dirname, '../sql/schema.sql')
  const seedPath = resolve(__dirname, '../sql/seed.sql')

  const schema = readFileSync(schemaPath, 'utf8')
  await client.query(schema)
  console.log('✅ Schema applied')

  const seed = readFileSync(seedPath, 'utf8')
  await client.query(seed)
  console.log('✅ Seed data inserted')

  const { rows } = await client.query('SELECT COUNT(*) FROM supermarkets')
  console.log(`✅ ${rows[0].count} supermarkets in database`)

  await client.end()
  console.log('🎉 Migration complete!')
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
