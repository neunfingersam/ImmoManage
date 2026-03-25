import { TenantForm } from '@/components/tenants/TenantForm'
import { createTenant } from '../_actions'

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Neuen Mieter anlegen</h1>
        <p className="text-sm text-muted-foreground mt-1">Mieter-Konto erstellen</p>
      </div>
      <TenantForm action={createTenant} />
    </div>
  )
}
