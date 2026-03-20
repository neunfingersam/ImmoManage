// app/tenant/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Home } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function TenantPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">
          Meine Wohnung
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Willkommen, {session?.user.name?.split(' ')[0]}!
        </p>
      </div>

      <EmptyState
        icon={Home}
        titel="Noch keine Wohnung zugewiesen"
        beschreibung="Dein Vermieter hat noch keine Wohnung für dich eingerichtet. Bitte wende dich an deinen Vermieter."
      />
    </div>
  )
}
