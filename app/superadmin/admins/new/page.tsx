import { prisma } from '@/lib/prisma'
import { NewAdminForm } from './NewAdminForm'

export default async function NewAdminPage() {
  const companies = await prisma.company.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Neuer Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin-Konto erstellen und einem Unternehmen zuweisen</p>
      </div>
      <NewAdminForm companies={companies} />
    </div>
  )
}
