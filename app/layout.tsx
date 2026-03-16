import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { auth } from '@/lib/auth'
import { NavHeader } from '@/components/nav-header'
import { Footer } from '@/components/footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'FolderFinder — Beste supermarkt aanbiedingen',
  description:
    'Vergelijk kortingen bij Albert Heijn, Jumbo, Lidl en 9 andere supermarkten. Stel je top 15 producten in en zie elke week de beste aanbiedingen — automatisch bijgewerkt.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen antialiased`}>
        {isAuthenticated && <NavHeader />}
        <main className={isAuthenticated ? 'pt-16' : ''}>
          {children}
        </main>
        {isAuthenticated && <Footer />}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
