// Einmalig: Text aus allen nicht-indizierten Dokumenten extrahieren
import path from 'path'
import fs from 'fs'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../lib/generated/prisma'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as any)

const docs = await prisma.document.findMany({
  where: { extractedText: null, fileType: { in: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] } },
})

console.log(`${docs.length} Dokumente ohne extractedText`)

for (const doc of docs) {
  const relativePath = doc.fileUrl.startsWith('/') ? doc.fileUrl.slice(1) : doc.fileUrl
  const filePath = path.join(process.cwd(), 'public', relativePath)

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${doc.name} → ${filePath}`)
    continue
  }

  const buffer = fs.readFileSync(filePath)
  let text = ''

  if (doc.fileType === 'application/pdf') {
    const pdfParse = ((await import('pdf-parse')) as any).default ?? (await import('pdf-parse'))
    const data = await (pdfParse as any)(buffer)
    text = data.text
  } else {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
  }

  await prisma.document.update({ where: { id: doc.id }, data: { extractedText: text.slice(0, 50000) } })
  console.log(`OK: ${doc.name} — ${text.length} Zeichen`)
}

await prisma.$disconnect()
