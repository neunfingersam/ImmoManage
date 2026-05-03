'use server'
import { revalidateAllLocales } from '@/lib/revalidate'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/action-utils'
import type { ActionResult } from '@/lib/action-result'

export type TemplateTexts = Record<string, Record<string, string>>

export async function getTemplateTexts(): Promise<TemplateTexts> {
  const session = await getAuthSession()
  if (!session?.user?.companyId) return {}
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { templateTexts: true },
  })
  return (company?.templateTexts as TemplateTexts) ?? {}
}

export async function saveTemplateText(
  key: string,
  locale: string,
  text: string,
): Promise<ActionResult<null>> {
  const session = await getAuthSession()
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { templateTexts: true },
  })
  const current = (company?.templateTexts as TemplateTexts) ?? {}
  const updated: TemplateTexts = {
    ...current,
    [key]: { ...(current[key] ?? {}), [locale]: text },
  }

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: { templateTexts: updated },
  })
  revalidateAllLocales('/dashboard/templates')
  return { success: true, data: null }
}
