// app/dashboard/properties/new/page.tsx
import { PropertyForm } from '@/components/properties/PropertyForm'
import { createProperty } from '../_actions'

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Neue Immobilie</h1>
        <p className="text-sm text-muted-foreground mt-1">Immobilie anlegen</p>
      </div>
      <PropertyForm
        action={createProperty}
        submitLabel="Immobilie erstellen"
        backHref="/dashboard/properties"
      />
    </div>
  )
}
