'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Folder, Mail, RefreshCw, Loader2 } from 'lucide-react'

const COOLDOWN_SECONDS = 60

export default function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [cooldown, setCooldown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [resentCount, setResentCount] = useState(0)

  // Tick down cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0 || isSending) return
    setIsSending(true)
    try {
      await signIn('resend', {
        email,
        redirectTo: '/dashboard',
        redirect: false,
      })
      setResentCount((n) => n + 1)
      setCooldown(COOLDOWN_SECONDS)
    } finally {
      setIsSending(false)
    }
  }, [email, cooldown, isSending])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
            <Folder className="w-7 h-7 text-white fill-white/30" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">FolderFinder</h1>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/60">
          <CardHeader className="pb-4 text-center">
            {/* Mail icon with animated ring */}
            <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4">
              <span className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-30" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-orange-100">
                <Mail className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <CardTitle className="text-xl">Magic link verzonden!</CardTitle>
            <CardDescription className="text-sm leading-relaxed mt-1">
              Controleer je inbox{email ? ' voor ' : ''}
              {email && (
                <span className="font-medium text-slate-700 break-all">{email}</span>
              )}
              {'. '}
              Klik op de link in de e-mail om in te loggen.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-4">
            {/* Resend button */}
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleResend}
              disabled={cooldown > 0 || isSending || !email}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opnieuw verzenden…
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 opacity-50" />
                  Opnieuw sturen over {cooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {resentCount > 0 ? 'Nogmaals verzenden' : 'Link opnieuw sturen'}
                </>
              )}
            </Button>

            {resentCount > 0 && (
              <p className="text-center text-xs text-green-600">
                Link opnieuw verzonden!
              </p>
            )}

            <p className="text-center text-xs text-slate-400">
              Geen e-mail ontvangen? Controleer ook je spam.
            </p>

            <div className="border-t pt-4">
              <a
                href="/login"
                className="block text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Terug naar inloggen
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
