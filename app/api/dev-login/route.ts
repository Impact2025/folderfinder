/**
 * Dev-only instant login — never runs in production
 * Creates user + session directly in DB and sets the session cookie
 */

import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email') ?? 'v.munster@weareimpact.nl'

  const client = await pool.connect()
  try {
    // Get or create user
    const { rows: existing } = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    )
    let userId: string
    if (existing.length > 0) {
      userId = existing[0].id
      await client.query(`UPDATE users SET "emailVerified" = NOW() WHERE id = $1`, [userId])
    } else {
      userId = randomUUID()
      await client.query(
        `INSERT INTO users (id, email, name, "emailVerified") VALUES ($1, $2, $3, NOW())`,
        [userId, email, email.split('@')[0]]
      )
    }
    const user = { id: userId }

    // Create session (expires in 30 days)
    const token = randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await client.query(
      `INSERT INTO sessions (id, "sessionToken", "userId", expires)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [randomUUID(), token, user.id, expires]
    )

    // Set cookie and redirect to dashboard
    const res = NextResponse.redirect(new URL('/dashboard', req.url))
    res.cookies.set('authjs.session-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      expires,
      path: '/',
    })

    return res
  } finally {
    client.release()
  }
}
