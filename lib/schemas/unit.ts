import { z } from 'zod'

export const unitSchema = z.object({
  propertyId: z.string().min(1),
  unitNumber: z.string().min(1, 'Einheitsnummer ist erforderlich'),
  floor: z.coerce.number().int().optional().nullable(),
  size: z.coerce.number().positive().optional().nullable(),
  rooms: z.coerce.number().positive().optional().nullable(),
  persons: z.coerce.number().int().min(1).optional().nullable(),
})

export type UnitFormValues = z.infer<typeof unitSchema>
