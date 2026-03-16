import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import {
  Flame,
  Trophy,
  Store,
  ArrowRight,
  ShoppingCart,
  Tag,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Mock deal data for the landing page preview
const PREVIEW_DEALS = [
  {
    id: 1,
    productName: 'Kipdijfilet',
    brand: 'AH',
    supermarketName: 'Albert Heijn',
    supermarketColor: '#00A0E2',
    normalPrice: 8.99,
    dealPrice: 5.99,
    discountPercent: 33,
    discountLabel: '1+1 gratis',
    unitSize: '500g',
    category: 'Vlees & Vis',
  },
  {
    id: 2,
    productName: 'Halfvolle Melk',
    brand: 'Zuivelhoeve',
    supermarketName: 'Jumbo',
    supermarketColor: '#FFC800',
    normalPrice: 1.39,
    dealPrice: 0.89,
    discountPercent: 36,
    discountLabel: 'Weekaanbieding',
    unitSize: '1L',
    category: 'Zuivel',
  },
  {
    id: 3,
    productName: 'Volkoren Pasta',
    brand: 'Barilla',
    supermarketName: 'Lidl',
    supermarketColor: '#0050AA',
    normalPrice: 2.29,
    dealPrice: 1.29,
    discountPercent: 44,
    discountLabel: 'Tijdelijk lager',
    unitSize: '500g',
    category: 'Pasta & Rijst',
  },
]

const FEATURES = [
  {
    icon: Flame,
    title: 'Echte kortingen',
    description:
      'Wij filteren reclamepraat eruit. Alleen deals met een echt lagere prijs ten opzichte van de normale prijs.',
  },
  {
    icon: Trophy,
    title: 'Top 15 producten',
    description:
      'Voer jouw 15 favoriete producten in en krijg elke week een persoonlijk overzicht van de beste deals.',
  },
  {
    icon: Store,
    title: 'Alle supermarkten',
    description:
      'Albert Heijn, Jumbo, Lidl, Plus, Aldi en 6 andere supermarkten — alles op één plek vergeleken.',
  },
]

function DealCardPreview({
  deal,
}: {
  deal: (typeof PREVIEW_DEALS)[number]
}) {
  return (
    <div className="deal-card flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-muted-foreground">
            {deal.category}
          </span>
          <span className="font-semibold text-foreground leading-snug">
            {deal.productName}
          </span>
          {deal.brand && (
            <span className="text-xs text-muted-foreground">{deal.brand}</span>
          )}
        </div>
        <span
          className="discount-fire shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: deal.supermarketColor }}
        >
          -{deal.discountPercent}%
        </span>
      </div>

      {/* Supermarket badge */}
      <div className="flex items-center gap-1.5">
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: deal.supermarketColor }}
        />
        <span className="text-xs text-muted-foreground">
          {deal.supermarketName}
        </span>
        {deal.unitSize && (
          <>
            <span className="text-xs text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground">{deal.unitSize}</span>
          </>
        )}
      </div>

      {/* Price row */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-foreground">
            €{deal.dealPrice.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            €{deal.normalPrice.toFixed(2)}
          </span>
        </div>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {deal.discountLabel}
        </span>
      </div>
    </div>
  )
}

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Minimal landing nav */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingCart className="size-4" />
            </div>
            <span className="tracking-tight">FolderFinder</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Inloggen
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
          {/* Subtle gradient background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <TrendingDown className="size-3" />
              Elke week automatisch bijgewerkt
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Vind de beste{' '}
              <span className="text-primary">supermarkt aanbiedingen</span>{' '}
              voor jouw producten
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Vergelijk kortingen bij Albert Heijn, Jumbo, Lidl en 9 andere
              supermarkten &mdash; automatisch elke week bijgewerkt
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/login">
                <Button size="lg" className="h-12 gap-2 px-8 text-base">
                  Begin gratis
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Geen creditcard vereist
              </p>
            </div>
          </div>
        </section>

        {/* Preview deals */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Tag className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                Voorbeeldaanbiedingen van deze week
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {PREVIEW_DEALS.map((deal) => (
                <DealCardPreview key={deal.id} deal={deal} />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Maak een gratis account aan om aanbiedingen voor jouw producten te zien
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Slim boodschappen doen
            </h2>
            <p className="mb-12 text-center text-muted-foreground">
              Geen eindeloos scrollen door folders meer
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">
              Klaar om te besparen?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Meld je aan en stel direct je top 15 producten in.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-12 gap-2 px-10 text-base">
                Begin gratis
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Landing footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            FolderFinder &copy; 2025 &mdash; Data van AH, Jumbo, Lidl en 8 andere supermarkten
          </p>
        </div>
      </footer>
    </div>
  )
}
