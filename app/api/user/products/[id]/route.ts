import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = parseInt(id, 10)

  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }

  // Verify ownership before deleting
  const rows = await sql`
    SELECT id FROM user_products
    WHERE id = ${productId} AND user_id = ${session.user.id}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await sql`DELETE FROM user_products WHERE id = ${productId}`

  // Re-index sort_order to keep it contiguous
  await sql`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS new_order
      FROM user_products
      WHERE user_id = ${session.user.id}
    )
    UPDATE user_products
    SET sort_order = numbered.new_order
    FROM numbered
    WHERE user_products.id = numbered.id
  `

  const products = await sql`
    SELECT id, user_id AS "userId", product_query AS "productQuery", sort_order AS "sortOrder", created_at AS "createdAt"
    FROM user_products
    WHERE user_id = ${session.user.id}
    ORDER BY sort_order
  `

  return NextResponse.json({ products })
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = parseInt(id, 10)

  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
  }

  let body: { sortOrder?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sortOrder = body.sortOrder

  if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
    return NextResponse.json({ error: 'sortOrder must be a non-negative integer' }, { status: 400 })
  }

  // Verify ownership
  const rows = await sql`
    SELECT id FROM user_products
    WHERE id = ${productId} AND user_id = ${session.user.id}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await sql`
    UPDATE user_products
    SET sort_order = ${sortOrder}
    WHERE id = ${productId}
  `

  const products = await sql`
    SELECT id, user_id AS "userId", product_query AS "productQuery", sort_order AS "sortOrder", created_at AS "createdAt"
    FROM user_products
    WHERE user_id = ${session.user.id}
    ORDER BY sort_order
  `

  return NextResponse.json({ products })
}
