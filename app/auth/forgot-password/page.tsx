// app/auth/forgot-password/page.tsx
import Link from 'next/link'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const { sent } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[#1A1A2E]">Passwort vergessen</h1>
          <p className="mt-2 text-sm text-gray-500">
            Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
            Falls diese E-Mail-Adresse bei uns registriert ist, wurde ein Link verschickt.
          </div>
        ) : (
          <form action="/api/auth/forgot-password" method="POST" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A2E] mb-1">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]"
                placeholder="name@beispiel.de"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#E8734A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#E8734A]/90 transition-colors"
            >
              Link anfordern
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link href="/auth/login" className="text-[#E8734A] hover:underline">Zurück zum Login</Link>
        </p>
      </div>
    </div>
  )
}
