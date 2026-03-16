import { getWeekNumber } from '@/lib/normalize'

/**
 * Returns the valid_from (Monday) and valid_until (Sunday) for the current week
 */
export function getWeekDates(): { validFrom: string; validUntil: string; week: number; year: number } {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...6=Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day)

  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const { week, year } = getWeekNumber(monday)

  return {
    validFrom: monday.toISOString().split('T')[0],
    validUntil: sunday.toISOString().split('T')[0],
    week,
    year,
  }
}
