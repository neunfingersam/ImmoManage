'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { DocumentFolder } from '@/lib/generated/prisma'

type FolderNode = DocumentFolder & { children?: FolderNode[] }

function buildTree(folders: DocumentFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>()
  const roots: FolderNode[] = []
  folders.forEach((f) => map.set(f.id, { ...f, children: [] }))
  folders.forEach((f) => {
    if (f.parentId) map.get(f.parentId)?.children?.push(map.get(f.id)!)
    else roots.push(map.get(f.id)!)
  })
  return roots
}

function FolderItem({ folder, lang, depth = 0 }: { folder: FolderNode; lang: string; depth?: number }) {
  const pathname = usePathname()
  const href = `/${lang}/dashboard/documents/${folder.id}`
  const isActive = pathname === href
  const icon = folder.type === 'PERSONAL' ? '👤' : folder.type === 'ASSEMBLY' ? '🗳️' : '📁'

  return (
    <li>
      <Link href={href} className={cn('flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted', isActive && 'bg-muted font-medium', depth > 0 && 'ml-4')}>
        <span>{icon}</span>
        <span className="truncate">{folder.name}</span>
      </Link>
      {folder.children && folder.children.length > 0 && (
        <ul>{folder.children.map((child: FolderNode) => <FolderItem key={child.id} folder={child} lang={lang} depth={depth + 1} />)}</ul>
      )}
    </li>
  )
}

export function FolderTree({ folders, lang }: { folders: DocumentFolder[]; lang: string }) {
  const tree = buildTree(folders)
  if (tree.length === 0) return <p className="text-sm text-muted-foreground px-2">Keine Ordner</p>
  return (
    <nav>
      <ul className="space-y-0.5">
        {tree.map((folder) => <FolderItem key={folder.id} folder={folder} lang={lang} />)}
      </ul>
    </nav>
  )
}
