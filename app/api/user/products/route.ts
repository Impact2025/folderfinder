import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

const MAX_PRODUCTS = 15
const MAX_QUERY_LENGTH = 100

function sanitize(input: string): string {
  // Trim whitespace, collapse internal whitespace, strip control characters
  return input
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_QUERY_LENGTH)
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await sql`
    SELECT id, user_id AS "userId", product_query AS "productQuery", sort_order AS "sortOrder", created_at AS "createdAt"
    FROM user_products
    WHERE user_id = ${session.user.id}
    ORDER BY sort_order
  `

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { productQuery?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawQuery = body.productQuery

  if (typeof rawQuery !== 'string' || rawQuery.trim().length === 0) {
    return NextResponse.json({ error: 'productQuery is required' }, { status: 400 })
  }

  if (rawQuery.trim().length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `productQuery may not exceed ${MAX_QUERY_LENGTH} characters` },
      { status: 400 }
    )
  }

  const productQuery = sanitize(rawQuery)

  // Check current count
  const countRows = await sql`
    SELECT COUNT(*)::int AS count FROM user_products WHERE user_id = ${session.user.id}
  `
  const currentCount: number = (countRows[0] as { count: number }).count

  if (currentCount >= MAX_PRODUCTS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_PRODUCTS} products allowed` },
      { status: 422 }
    )
  }

  // Sort order = end of list
  await sql`
    INSERT INTO user_products (user_id, product_query, sort_order)
    VALUES (${session.user.id}, ${productQuery}, ${currentCount})
  `

  const products = await sql`
    SELECT id, user_id AS "userId", product_query AS "productQuery", sort_order AS "sortOrder", created_at AS "createdAt"
    FROM user_products
    WHERE user_id = ${session.user.id}
    ORDER BY sort_order
  `

  return NextResponse.json({ products }, { status: 201 })
}
