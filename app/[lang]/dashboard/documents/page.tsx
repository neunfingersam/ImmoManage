import { FileText } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmptyState } from '@/components/shared/EmptyState'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm'
import { getDocuments } from './_actions'
import type { Document, User, Property } from '@/lib/generated/prisma'

type DocumentWithRels = Document & {
  uploadedBy: Pick<User, 'id' | 'name'>
  tenant: Pick<User, 'id' | 'name'> | null
  property: Pick<Property, 'id' | 'name'> | null
}

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  const [docs, tenants, properties] = await Promise.all([
    getDocuments(),
    prisma.user.findMany({
      where: { companyId: session?.user?.companyId ?? '', role: 'MIETER', active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.property.findMany({
      where: { companyId: session?.user?.companyId ?? '' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Dokumente</h1>
        <p className="text-sm text-muted-foreground mt-1">{docs.length} Dokument{docs.length !== 1 ? 'e' : ''}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Hochladen</h2>
        <DocumentUploadForm tenants={tenants} properties={properties} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Alle Dokumente</h2>
        {docs.length === 0 ? (
          <EmptyState icon={<FileText className="h-7 w-7" />} titel="Keine Dokumente" beschreibung="Noch keine Dokumente hochgeladen." />
        ) : (
          <div className="space-y-2">
            {docs.map(d => <DocumentCard key={d.id} doc={d as DocumentWithRels} />)}
          </div>
        )}
      </section>
    </div>
  )
}
