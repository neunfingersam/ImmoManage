import { HandoverForm } from './HandoverForm'
import { getLeasesForHandover } from '../_actions'

export default async function NewHandoverPage() {
  const leases = await getLeasesForHandover()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Übergabeprotokoll erstellen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dokumentiere den Zustand der Wohnung bei Ein- oder Auszug.
        </p>
      </div>
      <HandoverForm leases={leases as any} />
    </div>
  )
}
