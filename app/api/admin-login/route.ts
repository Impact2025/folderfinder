/**
 * Secret-protected instant login — works in all environments
 * Usage: /api/admin-login?secret=<ADMIN_LOGIN_SECRET>&email=<email>
 * Protected by ADMIN_LOGIN_SECRET env var — never expose this URL publicly
 */

import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  const email = searchParams.get('email') ?? 'v.munster@weareimpact.nl'

  if (!secret || secret !== process.env.ADMIN_LOGIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = await pool.connect()
  try {
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

    const token = randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await client.query(
      `INSERT INTO sessions (id, "sessionToken", "userId", expires) VALUES ($1, $2, $3, $4)`,
      [randomUUID(), token, userId, expires]
    )

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
