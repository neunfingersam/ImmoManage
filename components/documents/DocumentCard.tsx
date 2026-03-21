import { FileText, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteDocument } from '@/app/dashboard/documents/_actions'
import type { Document, User, Property } from '@/lib/generated/prisma'

type DocumentWithRels = Document & {
  uploadedBy: Pick<User, 'id' | 'name'>
  tenant: Pick<User, 'id' | 'name'> | null
  property: Pick<Property, 'id' | 'name'> | null
}

const categoryLabels: Record<string, string> = {
  MIETVERTRAG: 'Mietvertrag',
  HAUSORDNUNG: 'Hausordnung',
  NEBENKOSTENABRECHNUNG: 'Nebenkostenabr.',
  UEBERGABEPROTOKOLL: 'Übergabeprotokoll',
  SONSTIGES: 'Sonstiges',
}

export function DocumentCard({ doc }: { doc: DocumentWithRels }) {
  const date = new Date(doc.createdAt).toLocaleDateString('de-DE')

  async function handleDelete() {
    'use server'
    await deleteDocument(doc.id)
  }

  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="shrink-0 h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{doc.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {categoryLabels[doc.category] ?? doc.category} · {doc.tenant?.name ?? doc.property?.name ?? 'Global'} · {date}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline">{doc.scope}</Badge>
        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
          Öffnen
        </a>
        <form action={handleDelete}>
          <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Löschen">
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Card>
  )
}
