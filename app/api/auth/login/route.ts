import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const DEFAULT_USERS = [
  {
    email: 'v.munster@weareimpact.nl',
    hash: '$2b$12$owIxLs1uXXgtnr9tZNH1Oec2U95qh.XY7mi4PuSrFVn9zLAQhDiK2',
  },
]

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email as string | undefined)?.trim().toLowerCase()
  const password = body.password as string | undefined

  if (!email || !password) {
    return NextResponse.json({ error: 'Vul e-mail en wachtwoord in.' }, { status: 400 })
  }

  let allowed = DEFAULT_USERS
  try {
    const fromEnv = JSON.parse(process.env.CREDENTIALS_USERS ?? '[]')
    if (fromEnv.length > 0) allowed = fromEnv
  } catch { /* use default */ }

  const entry = allowed.find((u) => u.email.toLowerCase() === email)
  if (!entry || !(await bcrypt.compare(password, entry.hash))) {
    return NextResponse.json({ error: 'Onjuist e-mailadres of wachtwoord.' }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    // Get or create user
    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`, [email]
    )
    let userId: string
    if (rows.length > 0) {
      userId = rows[0].id
    } else {
      userId = randomUUID()
      await client.query(
        `INSERT INTO users (id, email, name, "emailVerified") VALUES ($1, $2, $3, NOW())`,
        [userId, email, email.split('@')[0]]
      )
    }

    // Create session
    const token = randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await client.query(
      `INSERT INTO sessions (id, "sessionToken", "userId", expires) VALUES ($1, $2, $3, $4)`,
      [randomUUID(), token, userId, expires]
    )

    const res = NextResponse.json({ ok: true })
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
