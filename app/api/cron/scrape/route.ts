import { NextRequest, NextResponse } from 'next/server'
import { runAllScrapers } from '@/scrapers/index'

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runAllScrapers()

    return NextResponse.json({
      success: true,
      message: 'Scrape completed',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[cron/scrape] Error:', message)

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
