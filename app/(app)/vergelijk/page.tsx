import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getISOWeek, getYear } from 'date-fns'
import { PriceCompareTable } from '@/components/price-compare-table'
import type { CompareRow } from '@/types'

export const dynamic = 'force-dynamic'

async function fetchCompareData(userId: string): Promise<{
  rows: CompareRow[]
  supermarkets: Array<{ slug: string; name: string; color: string }>
}> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/compare`, {
      headers: { 'x-user-id': userId },
      cache: 'no-store',
    })
    if (!res.ok) return { rows: [], supermarkets: [] }
    return res.json()
  } catch {
    return { rows: [], supermarkets: [] }
  }
}

export default async function VergelijkPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const week = getISOWeek(new Date())
  const year = getYear(new Date())

  const { rows, supermarkets } = await fetchCompareData(session.user.id)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Vergelijk prijzen{' '}
          <span className="text-muted-foreground font-normal text-xl">
            — week {week}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Zie per product welke supermarkt de laagste prijs heeft deze week.
        </p>
      </div>

      {/* Compare table */}
      <PriceCompareTable rows={rows} supermarkets={supermarkets} />
    </div>
  )
}
