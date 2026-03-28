import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getMyDocuments } from './_actions'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function TenantDocumentsPage() {
  const [t, locale, docs] = await Promise.all([
    getTranslations('tenant'),
    getLocale(),
    getMyDocuments(),
  ])

  const catKeyMap: Record<string, string> = {
    MIETVERTRAG: 'catMIETVERTRAG',
    HAUSORDNUNG: 'catHAUSORDNUNG',
    NEBENKOSTENABRECHNUNG: 'catNEBENKOSTENABRECHNUNG',
    UEBERGABEPROTOKOLL: 'catUEBERGABEPROTOKOLL',
    SONSTIGES: 'catSONSTIGES',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('myDocuments')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('docCount', { count: docs.length })}</p>
      </div>
      {docs.length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} titel={t('noDocsTitle')} beschreibung={t('noDocsDesc')} />
      ) : (
        <div className="space-y-2">
          {docs.map(d => (
            <Card key={d.id} className="p-4 flex items-center gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {catKeyMap[d.category] ? t(catKeyMap[d.category] as Parameters<typeof t>[0]) : d.category} · {new Date(d.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{d.scope}</Badge>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  {t('open')}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
