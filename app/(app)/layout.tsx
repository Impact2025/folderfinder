import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { NavHeader } from '@/components/nav-header'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <>
      <NavHeader userEmail={session.user.email} />
      <main>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </>
  )
}
