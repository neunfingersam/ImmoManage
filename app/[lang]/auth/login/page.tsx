// app/[lang]/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const [fehler, setFehler] = useState<string | null>(null)

  const verified = searchParams.get('verified') === '1'
  const verifyError = searchParams.get('verifyError')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(daten: LoginInput) {
    setFehler(null)

    const ergebnis = await signIn('credentials', {
      email: daten.email,
      password: daten.password,
      redirect: false,
    })

    if (ergebnis?.error) {
      setFehler(t('loginError'))
      return
    }

    // Weiterleitung übernimmt die Root-Seite (app/page.tsx)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo + Titel */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/logo.png" alt="ImmoManage" className="h-16 w-auto" />
          </div>
          <p className="mt-2 text-muted-foreground">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Verification banners */}
        {verified && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            E-Mail erfolgreich bestätigt! Du kannst dich jetzt anmelden.
          </div>
        )}
        {verifyError === 'expired' && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Der Bestätigungs-Link ist abgelaufen. Bitte registriere dich erneut.
          </div>
        )}
        {verifyError === 'invalid' && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Ungültiger Bestätigungs-Link.
          </div>
        )}

        {/* Login-Formular */}
        <div className="rounded-card bg-card p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* E-Mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                aria-describedby="email-error"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Passwort */}
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                autoComplete="current-password"
                aria-describedby="password-error"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Passwort vergessen */}
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-[#E8734A] hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Allgemeiner Fehler */}
            {fehler && (
              <div role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {fehler}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loggingIn')}
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
