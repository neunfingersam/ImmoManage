import { z } from 'zod'

export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  category: z.enum(['MIETVERTRAG', 'HAUSORDNUNG', 'NEBENKOSTENABRECHNUNG', 'UEBERGABEPROTOKOLL', 'SONSTIGES']),
  scope: z.enum(['TENANT', 'PROPERTY', 'GLOBAL']),
  tenantId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
})

export type DocumentUploadValues = z.infer<typeof documentUploadSchema>
