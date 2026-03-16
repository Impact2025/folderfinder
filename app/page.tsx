import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import {
  Flame,
  Trophy,
  Store,
  ArrowRight,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Static deal data ────────────────────────────────────────────────────────

const PREVIEW_DEALS = [
  {
    id: 1,
    productName: 'Kipdijfilet',
    brand: 'AH Biologisch',
    supermarketName: 'Albert Heijn',
    supermarketColor: '#00A0E2',
    supermarketTextColor: '#fff',
    normalPrice: 8.99,
    dealPrice: 5.99,
    discountPercent: 33,
    discountLabel: '1+1 gratis',
    unitSize: '500g',
    category: 'Vlees & Vis',
    validUntil: '23 maart',
  },
  {
    id: 2,
    productName: 'Halfvolle Melk',
    brand: 'Zuivelhoeve',
    supermarketName: 'Jumbo',
    supermarketColor: '#FFD700',
    supermarketTextColor: '#1a1a1a',
    normalPrice: 1.39,
    dealPrice: 0.89,
    discountPercent: 36,
    discountLabel: '2e halve prijs',
    unitSize: '1L',
    category: 'Zuivel',
    validUntil: '23 maart',
  },
  {
    id: 3,
    productName: 'Volkoren Pasta',
    brand: 'Barilla',
    supermarketName: 'Lidl',
    supermarketColor: '#0050AA',
    supermarketTextColor: '#fff',
    normalPrice: 2.29,
    dealPrice: 1.29,
    discountPercent: 44,
    discountLabel: 'Tijdelijk lager',
    unitSize: '500g',
    category: 'Pasta & Rijst',
    validUntil: '22 maart',
  },
]

const FEATURES = [
  {
    icon: Flame,
    title: 'Echte kortingen',
    description:
      'Wij filteren reclamepraat eruit. Alleen deals met een aantoonbaar lagere prijs ten opzichte van de normale prijs.',
    accent: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Trophy,
    title: 'Top 15 producten',
    description:
      'Voer jouw 15 favoriete producten in en ontvang elke week een persoonlijk overzicht van de beste deals.',
    accent: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Store,
    title: 'Alle 11 supermarkten',
    description:
      'Albert Heijn, Jumbo, Lidl, Plus, Aldi en nog 6 andere supermarkten — alles op één plek vergeleken.',
    accent: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
]

const SUPERMARKETS = [
  { name: 'Albert Heijn', bg: '#00A0E2', text: '#fff' },
  { name: 'Jumbo', bg: '#FFD700', text: '#1a1a1a' },
  { name: 'Lidl', bg: '#0050AA', text: '#fff' },
  { name: 'Aldi', bg: '#1D5AA8', text: '#fff' },
  { name: 'Plus', bg: '#E30613', text: '#fff' },
  { name: 'Dirk', bg: '#E4002B', text: '#fff' },
  { name: 'Hoogvliet', bg: '#009900', text: '#fff' },
]

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: (typeof PREVIEW_DEALS)[number] }) {
  const savings = (deal.normalPrice - deal.dealPrice).toFixed(2)

  return (
    <div className="deal-card group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg">
      {/* Top bar with supermarket pill + discount badge */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        {/* Supermarket pill */}
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
          style={{ backgroundColor: deal.supermarketColor, color: deal.supermarketTextColor }}
        >
          {deal.supermarketName}
        </span>

        {/* Discount badge */}
        <span className="discount-fire inline-flex items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 px-2.5 py-1 text-xs font-extrabold tracking-tight text-white shadow-sm shadow-red-500/30">
          -{deal.discountPercent}%
        </span>
      </div>

      {/* Product info */}
      <div className="flex flex-1 flex-col gap-1 px-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {deal.category} · {deal.unitSize}
        </p>
        <h3 className="text-lg font-bold leading-tight text-foreground">
          {deal.productName}
        </h3>
        <p className="text-xs text-muted-foreground">{deal.brand}</p>
      </div>

      {/* Divider */}
      <div className="mx-4 my-3 h-px bg-border/60" />

      {/* Price + label */}
      <div className="flex items-end justify-between px-4 pb-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
            €{deal.dealPrice.toFixed(2)}
          </span>
          <span className="text-sm font-medium text-muted-foreground line-through">
            €{deal.normalPrice.toFixed(2)}
          </span>
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: deal.supermarketColor + '20', color: deal.supermarketColor }}
        >
          {deal.discountLabel}
        </span>
      </div>

      {/* Savings callout + valid until */}
      <div className="mx-4 mb-4 mt-2 flex items-center justify-between rounded-lg bg-green-500/8 px-3 py-1.5">
        <span className="text-xs font-medium text-green-700 dark:text-green-400">
          Jij bespaart €{savings}
        </span>
        <span className="text-[11px] text-muted-foreground">
          t/m {deal.validUntil}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background antialiased">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm shadow-blue-500/30">
              <ShoppingCart className="size-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              FolderFinder
            </span>
          </div>

          {/* Nav right */}
          <div className="flex items-center gap-3">
            <Link
              href="#hoe-werkt-het"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Hoe werkt het?
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border/60 text-sm font-medium"
              >
                Inloggen
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition-all hover:shadow-blue-500/40 hover:opacity-90"
              >
                Begin gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">

          {/* Background glow blobs */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
            <div className="absolute right-[5%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/8 blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-sky-400/6 blur-[80px]" />
          </div>

          {/* Subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="mx-auto max-w-4xl text-center">

            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
              <Sparkles className="size-3.5" />
              Elke week automatisch bijgewerkt · Gratis
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem] lg:leading-[1.1]">
              Vind de beste{' '}
              <span className="relative inline-block">
                <span className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent">
                  supermarkt&shy;aanbiedingen
                </span>
                {/* Underline decoration */}
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-sky-300 opacity-60" />
              </span>{' '}
              voor jouw producten
            </h1>

            {/* Subtext */}
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Voer jouw 15 favoriete producten in en zie meteen{' '}
              <strong className="font-semibold text-foreground">
                waar je de meeste bespaart
              </strong>{' '}
              — bij Albert Heijn, Jumbo, Lidl en 8 andere supermarkten.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-8 text-base font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/35 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                >
                  Begin gratis
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link
                href="#hoe-werkt-het"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border/60 bg-background px-8 text-base font-medium text-foreground shadow-sm transition-all hover:bg-muted/60"
              >
                Hoe werkt het?
                <ChevronDown className="size-4 text-muted-foreground" />
              </Link>
            </div>

            {/* Trust line */}
            <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-green-500" />
              Geen creditcard vereist &nbsp;·&nbsp; Direct aan de slag
            </p>
          </div>
        </section>

        {/* ── Social proof strip ──────────────────────────────────────────────── */}
        <div className="border-y border-border/40 bg-muted/30 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
            <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              Vergelijkt
            </span>
            {SUPERMARKETS.map((sm) => (
              <span
                key={sm.name}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide"
                style={{ backgroundColor: sm.bg, color: sm.text }}
              >
                {sm.name}
              </span>
            ))}
            <span className="text-xs font-medium text-muted-foreground">+ 4 meer</span>
          </div>
        </div>

        {/* ── Live deal preview ───────────────────────────────────────────────── */}
        <section id="aanbiedingen" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">

            {/* Section header */}
            <div className="mb-10 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-green-500" />
                Live aanbiedingen
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Zo zien jouw deals eruit
              </h2>
              <p className="mt-2 text-muted-foreground">
                Voorbeeldaanbiedingen van deze week
              </p>
            </div>

            {/* Deal cards grid */}
            <div className="grid gap-5 sm:grid-cols-3">
              {PREVIEW_DEALS.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>

            {/* CTA below cards */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Maak een gratis account aan om aanbiedingen voor{' '}
              <em className="font-medium not-italic text-foreground">jouw</em>{' '}
              producten te zien.{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                Begin nu &rarr;
              </Link>
            </p>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────────── */}
        <section id="hoe-werkt-het" className="bg-muted/25 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">

            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Slim boodschappen doen
              </h2>
              <p className="mt-2 text-muted-foreground">
                Geen eindeloos scrollen door folders meer
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* Step number */}
                    <span className="absolute right-5 top-5 text-5xl font-black text-muted-foreground/5 select-none">
                      {i + 1}
                    </span>

                    {/* Icon */}
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl ${feature.bg} ${feature.accent}`}
                    >
                      <Icon className="size-5" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── How it works – steps ────────────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              In 3 stappen besparen
            </h2>

            <ol className="relative flex flex-col gap-0">
              {[
                {
                  step: '01',
                  title: 'Maak een gratis account',
                  body: 'Registreer met je e-mailadres. Geen creditcard, geen verborgen kosten.',
                },
                {
                  step: '02',
                  title: 'Voer jouw 15 producten in',
                  body: 'Voeg de producten toe die je elke week koopt — van kip tot pasta tot wasmiddel.',
                },
                {
                  step: '03',
                  title: 'Ontvang jouw dealoverzicht',
                  body: 'Elke maandag zie je bij welke supermarkt jij het goedkoopst uit bent deze week.',
                },
              ].map(({ step, title, body }, i, arr) => (
                <li key={step} className="relative flex gap-5 pb-10 last:pb-0">
                  {/* Connecting line */}
                  {i < arr.length - 1 && (
                    <div className="absolute left-5 top-10 h-full w-px -translate-x-1/2 bg-border" />
                  )}

                  {/* Step circle */}
                  <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-500/40 bg-blue-500/10 text-xs font-black text-blue-600 dark:text-blue-400">
                    {step}
                  </div>

                  {/* Content */}
                  <div className="pt-1.5">
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-1">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" />

            {/* Inner content */}
            <div className="relative overflow-hidden rounded-[calc(1.5rem-4px)] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 px-8 py-14 text-center sm:px-14">
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
              </div>

              <h2 className="relative mb-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Begin nu gratis
              </h2>
              <p className="relative mx-auto mb-8 max-w-md text-base text-blue-100">
                Vergelijk supermarktaanbiedingen en bespaar wekelijks op jouw
                boodschappen.
              </p>

              <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="h-12 gap-2 rounded-full bg-white px-8 text-base font-bold text-blue-700 shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-50 hover:shadow-xl"
                  >
                    Maak gratis account
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>

              <p className="relative mt-5 text-sm text-blue-200">
                Geen creditcard vereist &nbsp;·&nbsp; Direct starten
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                <ShoppingCart className="size-3 text-white" />
              </div>
              <span className="text-sm font-bold text-foreground">FolderFinder</span>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              &copy; 2026 FolderFinder &mdash; Vergelijkt Albert Heijn, Jumbo, Lidl, Aldi, Plus, Dirk en 5 meer
            </p>

            <Link
              href="/login"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Inloggen &rarr;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
