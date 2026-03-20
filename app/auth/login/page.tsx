// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'

export default function LoginPage() {
  const router = useRouter()
  const [fehler, setFehler] = useState<string | null>(null)

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
      setFehler('E-Mail oder Passwort ist falsch.')
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
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-3xl text-foreground">ImmoManage</h1>
          <p className="mt-2 text-muted-foreground">
            Melde dich an, um fortzufahren.
          </p>
        </div>

        {/* Login-Formular */}
        <div className="rounded-card bg-card p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* E-Mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Passwort */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Dein Passwort"
                autoComplete="current-password"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Allgemeiner Fehler */}
            {fehler && (
              <div className="rounded-sm bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
