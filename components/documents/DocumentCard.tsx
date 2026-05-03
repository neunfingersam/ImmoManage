'use client'

import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteDocument } from '@/app/[lang]/dashboard/documents/_actions'
import type { Document, User, Property } from '@/lib/generated/prisma'
import { DocumentSummaryButton } from './DocumentSummaryButton'
import { DocumentDeleteButton } from './DocumentDeleteButton'

type DocumentWithRels = Document & {
  uploadedBy: Pick<User, 'id' | 'name'>
  tenant: Pick<User, 'id' | 'name'> | null
  property: Pick<Property, 'id' | 'name'> | null
}

const CATEGORY_KEY: Record<string, string> = {
  MIETVERTRAG: 'categoryMietvertrag',
  HAUSORDNUNG: 'categoryHausordnung',
  NEBENKOSTENABRECHNUNG: 'categoryNebenkostenabrechnung',
  UEBERGABEPROTOKOLL: 'categoryUebergabeprotokoll',
  SONSTIGES: 'categorySonstiges',
  EINLADUNG: 'categoryEinladung',
  VERSAMMLUNGSPROTOKOLL: 'categoryVersammlungsprotokoll',
  VOLLMACHT: 'categoryVollmacht',
  JAHRESRECHNUNG: 'categoryJahresrechnung',
  BUDGET: 'categoryBudget',
  HAUSWART_BELEG: 'categoryHauswartBeleg',
}

const SCOPE_KEY: Record<string, string> = {
  TENANT: 'scopeTenant',
  PROPERTY: 'scopeProperty',
  GLOBAL: 'scopeGlobal',
}

export function DocumentCard({ doc }: { doc: DocumentWithRels }) {
  const t = useTranslations('documents')
  const date = new Date(doc.createdAt).toLocaleDateString()
  async function handleDelete() { await deleteDocument(doc.id) }
  const categoryLabel = CATEGORY_KEY[doc.category] ? t(CATEGORY_KEY[doc.category] as any) : doc.category
  const scopeLabel = SCOPE_KEY[doc.scope] ? t(SCOPE_KEY[doc.scope] as any) : doc.scope

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center gap-3">
        <div className="shrink-0 h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{doc.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {categoryLabel} · {doc.tenant?.name ?? doc.property?.name ?? t('scopeGlobal')} · {date}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline">{scopeLabel}</Badge>
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            {t('open')}
          </a>
          <DocumentDeleteButton action={handleDelete} />
        </div>
      </div>
      <DocumentSummaryButton docId={doc.id} />
    </Card>
  )
}
