import { getPersonsForProperty, ensurePersonalFolderForUserAction } from '@/app/[lang]/dashboard/documents/_actions'
import { redirect } from 'next/navigation'

type Props = {
  propertyId: string
  lang: string
  propertyName: string
}

function PersonButton({
  userId,
  name,
  propertyId,
  lang,
}: {
  userId: string
  name: string
  propertyId: string
  lang: string
}) {
  async function openFolder() {
    'use server'
    const result = await ensurePersonalFolderForUserAction(userId, propertyId)
    if (result.success) {
      redirect(`/${lang}/dashboard/documents/${result.data.folderId}`)
    }
  }

  return (
    <form action={openFolder}>
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm hover:bg-muted w-full text-left transition-colors"
      >
        <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </span>
        <span>{name}</span>
      </button>
    </form>
  )
}

export async function PersonList({ propertyId, lang, propertyName }: Props) {
  const { owners, tenants } = await getPersonsForProperty(propertyId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl text-foreground mb-1">Persönliche Unterlagen</h2>
        <p className="text-sm text-muted-foreground">{propertyName}</p>
      </div>

      {owners.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Eigentümer
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {owners.map(o => (
              <PersonButton key={o.id} userId={o.id} name={o.name} propertyId={propertyId} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {tenants.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Mieter
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tenants.map(t => (
              <PersonButton key={t.id} userId={t.id} name={t.name} propertyId={propertyId} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {owners.length === 0 && tenants.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Keine Personen für diese Liegenschaft gefunden.
        </p>
      )}
    </div>
  )
}
