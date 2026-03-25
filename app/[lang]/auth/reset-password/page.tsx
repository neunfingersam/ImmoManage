// app/auth/reset-password/page.tsx
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; success?: string }>
}) {
  const { token, error, success } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
        <div className="text-center">
          <p className="text-red-600">Ungültiger oder abgelaufener Link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[#1A1A2E]">Neues Passwort</h1>
        </div>

        {success ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
            Passwort erfolgreich geändert.{' '}
            <a href="/auth/login" className="underline">Jetzt einloggen</a>
          </div>
        ) : (
          <form action="/api/auth/reset-password" method="POST" className="space-y-4">
            <input type="hidden" name="token" value={token} />
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error === 'expired' ? 'Link abgelaufen. Bitte neu anfordern.' : 'Ungültiger Link.'}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Neues Passwort</label>
              <input name="password" type="password" required minLength={8}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]"
                placeholder="Mindestens 8 Zeichen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Passwort bestätigen</label>
              <input name="confirm" type="password" required minLength={8}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]"
                placeholder="Passwort wiederholen" />
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-[#E8734A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#E8734A]/90 transition-colors">
              Passwort speichern
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
