import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { buildCompareMatrix } from '@/lib/matching'
import type { Supermarket, UserProduct } from '@/types'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const [userProductRows, supermarketRows] = await Promise.all([
    sql`
      SELECT id, user_id AS "userId", product_query AS "productQuery", sort_order AS "sortOrder", created_at AS "createdAt"
      FROM user_products
      WHERE user_id = ${userId}
      ORDER BY sort_order
    `,
    sql`
      SELECT id, slug, name, logo_url AS "logoUrl", website_url AS "websiteUrl", color, is_active AS "isActive"
      FROM supermarkets
      WHERE is_active = true
      ORDER BY name
    `,
  ])

  const userProducts = userProductRows as UserProduct[]
  const supermarkets = supermarketRows as Supermarket[]

  const queries = userProducts.map((p) => p.productQuery)
  const supermarketSlugs = supermarkets.map((s) => s.slug)

  const matrix = await buildCompareMatrix(queries, supermarketSlugs)

  return NextResponse.json({
    matrix,
    supermarkets,
    queries,
    updatedAt: new Date().toISOString(),
  })
}
