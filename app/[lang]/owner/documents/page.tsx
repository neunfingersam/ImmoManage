import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTranslations } from 'next-intl/server'
import { getFoldersForProperty } from '@/app/[lang]/dashboard/documents/_actions'
import { FolderTree } from '@/components/documents/folder-tree'

export default async function OwnerDocumentsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return null

  const t = await getTranslations('owner')

  const catKeyMap: Record<string, string> = {
    MIETVERTRAG: 'catMIETVERTRAG', HAUSORDNUNG: 'catHAUSORDNUNG',
    NEBENKOSTENABRECHNUNG: 'catNEBENKOSTENABRECHNUNG', UEBERGABEPROTOKOLL: 'catUEBERGABEPROTOKOLL',
    SONSTIGES: 'catSONSTIGES', EINLADUNG: 'catEINLADUNG',
    VERSAMMLUNGSPROTOKOLL: 'catVERSAMMLUNGSPROTOKOLL', VOLLMACHT: 'catVOLLMACHT',
    JAHRESRECHNUNG: 'catJAHRESRECHNUNG', BUDGET: 'catBUDGET', HAUSWART_BELEG: 'catHAUSWART_BELEG',
  }

  // Owner sees: own documents + property documents for their properties + global
  const ownerships = await prisma.propertyOwner.findMany({
    where: { userId: session.user.id },
    select: { propertyId: true },
  })
  const propertyIds = ownerships.map((o: { propertyId: string }) => o.propertyId)

  const [docs, folders] = await Promise.all([
    prisma.document.findMany({
      where: {
        companyId: session.user.companyId,
        OR: [
          { scope: 'TENANT', tenantId: session.user.id },
          { scope: 'PROPERTY', propertyId: { in: propertyIds } },
          { scope: 'GLOBAL' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    }),
    propertyIds.length === 1
      ? getFoldersForProperty(propertyIds[0])
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('documents')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{docs.length} {t('documentsCount', { count: docs.length })}</p>
      </div>

      {folders.length > 0 && (
        <aside className="mb-6">
          <p className="mb-2 text-sm font-semibold">Ordner</p>
          <FolderTree folders={folders} lang={lang} />
        </aside>
      )}

      {docs.length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} titel={t('noDocuments')} beschreibung={t('noDocumentsDesc')} />
      ) : (
        <div className="space-y-2">
          {docs.map((d: { id: string; name: string; category: string; createdAt: Date; fileUrl: string }) => (
            <Card key={d.id} className="p-4 flex items-center gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {catKeyMap[d.category] ? t(catKeyMap[d.category] as Parameters<typeof t>[0]) : d.category} · {new Date(d.createdAt).toLocaleDateString(lang)}
                </p>
              </div>
              <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                {t('open')}
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
