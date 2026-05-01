import { FileText } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmptyState } from '@/components/shared/EmptyState'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm'
import { PropertyTabs } from '@/components/documents/PropertyTabs'
import { FolderTree } from '@/components/documents/folder-tree'
import { PersonList } from '@/components/documents/PersonList'
import { getDocuments, getFoldersForProperty } from './_actions'
import { ensureSystemFolders, ensurePersonalFolderForUser } from '@/lib/document-folders'
import type { Document, User, Property } from '@/lib/generated/prisma'
import { getTranslations } from 'next-intl/server'

type DocumentWithRels = Document & {
  uploadedBy: Pick<User, 'id' | 'name'>
  tenant: Pick<User, 'id' | 'name'> | null
  property: Pick<Property, 'id' | 'name'> | null
}

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  const sp = await searchParams
  const propertyIdStr = typeof sp.propertyId === 'string' ? sp.propertyId : undefined
  const section = typeof sp.section === 'string' ? sp.section : undefined

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  const isAdmin = ['ADMIN', 'VERMIETER', 'SUPER_ADMIN'].includes(role ?? '')

  // Ensure system folders exist when a property is selected
  if (propertyIdStr && session?.user?.companyId) {
    await ensureSystemFolders(propertyIdStr, session.user.companyId)
  }

  // Non-admin accessing personal section → redirect directly to own folder
  if (propertyIdStr && section === 'personal' && !isAdmin && userId && session?.user?.companyId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
    if (user) {
      const folder = await ensurePersonalFolderForUser(userId, propertyIdStr, session.user.companyId, user.name)
      redirect(`/${lang}/dashboard/documents/${folder.id}`)
    }
  }

  const [t, docs, tenants, properties, folders] = await Promise.all([
    getTranslations('documents'),
    getDocuments(propertyIdStr),
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
    propertyIdStr ? getFoldersForProperty(propertyIdStr) : Promise.resolve([]),
  ])

  const selectedProperty = propertyIdStr ? properties.find(p => p.id === propertyIdStr) : undefined
  const showPersonList = section === 'personal' && !!propertyIdStr && isAdmin

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
        {!showPersonList && (
          <p className="text-sm text-muted-foreground mt-1">
            {docs.length === 1 ? t('docCount', { count: 1 }) : t('docCountPlural', { count: docs.length })}
          </p>
        )}
      </div>

      <PropertyTabs properties={properties} />

      {!showPersonList && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('uploadSection')}</h2>
          <DocumentUploadForm
            tenants={tenants}
            properties={properties}
            defaultPropertyId={propertyIdStr}
          />
        </section>
      )}

      <section className="space-y-3">
        {!showPersonList && (
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t('allSection')}
          </h2>
        )}
        <div className="flex gap-6">
          {propertyIdStr && (
            <aside className="w-56 shrink-0">
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">{t('folderLabel')}</p>
              <FolderTree folders={folders} lang={lang} propertyId={propertyIdStr} />
            </aside>
          )}
          <div className="flex-1">
            {showPersonList ? (
              <PersonList
                propertyId={propertyIdStr!}
                lang={lang}
                propertyName={selectedProperty?.name ?? ''}
              />
            ) : docs.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-7 w-7" />}
                titel={t('empty')}
                beschreibung={t('emptyDesc')}
              />
            ) : (
              <div className="space-y-2">
                {docs.map(d => (
                  <DocumentCard key={d.id} doc={d as DocumentWithRels} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
