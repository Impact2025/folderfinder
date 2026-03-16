import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ProductInput } from '@/components/product-input'
import type { UserProduct } from '@/types'

export const dynamic = 'force-dynamic'

const MAX_PRODUCTS = 15

async function fetchUserProducts(userId: string): Promise<UserProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/products`, {
      headers: { 'x-user-id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.products ?? []
  } catch {
    return []
  }
}

export default async function ProductenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const products = await fetchUserProducts(session.user.id)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mijn producten
        </h1>
        <p className="text-sm text-muted-foreground">
          Voeg producten toe die je regelmatig koopt. Wij zoeken de beste aanbiedingen.
        </p>
      </div>

      {/* Interactive client component */}
      <ProductInput initialProducts={products} maxProducts={MAX_PRODUCTS} />
    </div>
  )
}
