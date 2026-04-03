import { notFound } from 'next/navigation'
import { getFolderContents } from '../_actions'
import Link from 'next/link'

type FolderContents = Awaited<ReturnType<typeof getFolderContents>>
type SubFolder = FolderContents['subfolders'][number]
type FolderDoc = FolderContents['documents'][number]

export default async function FolderPage({
  params,
}: {
  params: Promise<{ lang: string; folderId: string }>
}) {
  const { lang, folderId } = await params
  const { folder, documents, subfolders, propertyName } = await getFolderContents(folderId)
  if (!folder) notFound()

  const typeLabel =
    folder.type === 'PERSONAL' ? 'Persönliche Dokumente' :
    folder.type === 'ASSEMBLY' ? 'Versammlungsdokumente' : 'Allgemeine Dokumente'

  const docsBase = `/${lang}/dashboard/documents`
  const propertyLink = folder.propertyId
    ? `${docsBase}?propertyId=${folder.propertyId}`
    : docsBase

  return (
    <div>
      <nav className="mb-4 text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
        <Link href={docsBase} className="hover:text-foreground">Dokumente</Link>
        {propertyName && (
          <>
            <span>/</span>
            <Link href={propertyLink} className="hover:text-foreground">{propertyName}</Link>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-foreground">{folder.name}</span>
      </nav>

      <h1 className="mb-1 text-xl font-semibold">{folder.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{typeLabel}</p>

      {subfolders.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium">Unterordner</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {subfolders.map((sub: SubFolder) => (
              <Link
                key={sub.id}
                href={`/${lang}/dashboard/documents/${sub.id}`}
                className="flex items-center gap-2 rounded border p-3 text-sm hover:bg-muted"
              >
                📁 {sub.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium">Dokumente ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Dokumente in diesem Ordner.</p>
        ) : (
          <ul className="divide-y rounded border">
            {documents.map((doc: FolderDoc) => (
              <li key={doc.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{doc.name}</span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Öffnen
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
