'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Folder, Mail, ArrowRight, Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Onjuist e-mailadres of wachtwoord.')
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setIsPending(false)
    }
  }

  async function handleMagicLink() {
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) return
    setIsPending(true)
    try {
      await signIn('resend', {
        email: trimmed,
        redirectTo: '/dashboard',
        redirect: false,
      })
      setSubmitted(true)
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
            <Folder className="w-7 h-7 text-white fill-white/30" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">FolderFinder</h1>
          <p className="text-sm text-slate-500">Vind de beste supermarktaanbiedingen</p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/60">
          <CardHeader className="pb-4">
            {submitted ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-center text-lg">Controleer je inbox</CardTitle>
                <CardDescription className="text-center">
                  We hebben een magic link gestuurd naar{' '}
                  <span className="font-medium text-slate-700">{email.trim()}</span>
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-lg">Inloggen</CardTitle>
                <CardDescription>
                  Log in met je e-mailadres en wachtwoord.
                </CardDescription>
              </>
            )}
          </CardHeader>

          {!submitted && (
            <CardContent className="pt-0">
              <form onSubmit={handleCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mailadres</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="h-11"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isPending || !email.trim() || !password}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inloggen…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Inloggen
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400">
                  <span className="bg-white px-2">of</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isPending || !email.trim()}
                onClick={handleMagicLink}
                className="w-full h-11"
              >
                <Mail className="w-4 h-4 mr-2" />
                Stuur magic link
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="mt-5 text-center text-xs text-slate-500">
                Geen account?{' '}
                <span className="text-slate-700">
                  Vraag toegang aan de beheerder.
                </span>
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  )
}
