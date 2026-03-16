'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, ShoppingBasket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { handleSignOut } from '@/app/actions'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/producten', label: 'Producten' },
  { href: '/vergelijk', label: 'Vergelijk' },
]

interface NavHeaderProps {
  userEmail?: string | null
}

export function NavHeader({ userEmail }: NavHeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <ShoppingBasket className="size-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            FolderFinder
          </span>
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex px-1.5 py-0 text-[10px] font-semibold leading-4 rounded-sm"
          >
            beta
          </Badge>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative py-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side — desktop */}
        <div className="hidden items-center gap-3 sm:flex">
          {userEmail && (
            <span className="max-w-[160px] truncate text-sm text-muted-foreground">
              {userEmail}
            </span>
          )}
          <form action={handleSignOut}>
            <button
              type="submit"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Uitloggen
            </button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={menuOpen}
        >
          <span
            className={cn(
              'absolute transition-all duration-200',
              menuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
            )}
          >
            <X className="size-5" />
          </span>
          <span
            className={cn(
              'absolute transition-all duration-200',
              menuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
            )}
          >
            <Menu className="size-5" />
          </span>
        </button>
      </nav>

      {/* Mobile menu — CSS height transition */}
      <div
        className={cn(
          'overflow-hidden border-t border-border bg-background/95 transition-all duration-200 ease-in-out sm:hidden',
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Mobile sign-out row */}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
            {userEmail && (
              <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                {userEmail}
              </span>
            )}
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
