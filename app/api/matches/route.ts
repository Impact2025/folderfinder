import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { findMatchesForUser } from '@/lib/matching'
import type { MatchedGroup } from '@/types'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const userProducts = await sql`
    SELECT id, user_id AS "userId", product_query AS "productQuery", sort_order AS "sortOrder", created_at AS "createdAt"
    FROM user_products
    WHERE user_id = ${userId}
    ORDER BY sort_order
  `

  const groups: MatchedGroup[] = await findMatchesForUser(
    userProducts as Array<{ productQuery: string; sortOrder: number }>
  )

  const now = new Date()
  // ISO week number
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000) + 1
  const weekNumber = Math.ceil(dayOfYear / 7)
  const year = now.getFullYear()

  return NextResponse.json(
    {
      groups,
      updatedAt: now.toISOString(),
      weekNumber,
      year,
    },
    {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
