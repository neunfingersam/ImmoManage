// lib/agent/extract.ts
import path from 'path'
import fs from 'fs'

export async function extractText(fileUrl: string, fileType: string): Promise<string> {
  // fileUrl ist z.B. /uploads/companyId/userId/file.pdf
  // Dateien liegen in public/uploads/...
  const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl
  const absolutePath = path.join(process.cwd(), 'public', relativePath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Datei nicht gefunden: ${absolutePath}`)
  }

  const buffer = fs.readFileSync(absolutePath)

  if (fileType === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse')
    const data = await pdfParse(buffer)
    return (data.text as string).replace(/\u0000/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '')
  }

  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // Bilder: kein Text
  return ''
}

export function chunkText(text: string, maxTokens = 500): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  const wordsPerChunk = Math.floor(maxTokens * 0.75)
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '))
  }
  return chunks.filter(c => c.length > 20)
}
