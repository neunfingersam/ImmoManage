'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { changePasswordAction } from './_actions'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.newPassword !== form.confirm) {
      setError('Passwörter stimmen nicht überein')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Neues Passwort muss mindestens 8 Zeichen haben')
      return
    }
    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      if (result.success) {
        // Re-login to refresh JWT (mustChangePassword is now false in DB)
        await signOut({ callbackUrl: '/auth/login?passwordChanged=1' })
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[#1A1A2E]">Passwort ändern</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bitte setzen Sie ein neues Passwort, bevor Sie fortfahren.
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          Sie verwenden ein temporäres Passwort. Bitte wählen Sie jetzt ein persönliches Passwort.
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Temporäres Passwort
            </label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]"
              placeholder="Ihr temporäres Passwort"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Neues Passwort
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Passwort bestätigen
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]"
              placeholder="Passwort wiederholen"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#E8734A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#E8734A]/90 transition-colors disabled:opacity-50"
          >
            {pending ? 'Wird gespeichert…' : 'Passwort speichern & anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
