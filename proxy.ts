export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/(app)/:path*', '/api/user/:path*', '/api/matches', '/api/compare'],
}
