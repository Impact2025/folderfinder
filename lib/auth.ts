import NextAuth from 'next-auth'
import PostgresAdapter from '@auth/pg-adapter'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? 'FolderFinder <noreply@folderfinder.nl>',
    }),
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Wachtwoord', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        // Load allowed users from env, with built-in demo fallback
        const defaultUsers = [
          {
            email: 'v.munster@weareimpact.nl',
            hash: '$2b$12$owIxLs1uXXgtnr9tZNH1Oec2U95qh.XY7mi4PuSrFVn9zLAQhDiK2',
          },
        ]
        let allowed: Array<{ email: string; hash: string }> = defaultUsers
        try {
          const fromEnv = JSON.parse(process.env.CREDENTIALS_USERS ?? '[]')
          if (fromEnv.length > 0) allowed = fromEnv
        } catch {
          // keep default
        }

        const entry = allowed.find((u) => u.email.toLowerCase() === email)
        if (!entry) return null

        const valid = await bcrypt.compare(password, entry.hash)
        if (!valid) return null

        // Get or create user in DB
        const client = await pool.connect()
        try {
          const { rows } = await client.query<{ id: string; email: string; name: string | null }>(
            `SELECT id, email, name FROM users WHERE email = $1`,
            [email]
          )
          if (rows.length > 0) {
            return { id: rows[0].id, email: rows[0].email, name: rows[0].name }
          }
          // Create new user
          const { randomUUID } = await import('node:crypto')
          const id = randomUUID()
          await client.query(
            `INSERT INTO users (id, email, name, "emailVerified") VALUES ($1, $2, $3, NOW())`,
            [id, email, email.split('@')[0]]
          )
          return { id, email, name: email.split('@')[0] }
        } finally {
          client.release()
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
  },
  session: {
    strategy: 'database',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
