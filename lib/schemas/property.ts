import { z } from 'zod'

export const propertySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  type: z.enum(['SINGLE', 'MULTI']),
  unitCount: z.coerce.number().int().min(1, 'Mindestens 1 Einheit'),
  year: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  description: z.string().optional().nullable(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>
