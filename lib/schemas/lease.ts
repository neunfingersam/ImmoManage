import { z } from 'zod'

export const leaseSchema = z.object({
  unitId: z.string().min(1, 'Einheit ist erforderlich'),
  tenantId: z.string().min(1, 'Mieter ist erforderlich'),
  startDate: z.string().min(1, 'Startdatum ist erforderlich'),
  endDate: z.string().optional().nullable(),
  coldRent: z.coerce.number().min(0, 'Kaltmiete darf nicht negativ sein'),
  extraCosts: z.coerce.number().min(0, 'Nebenkosten dürfen nicht negativ sein'),
  depositPaid: z.boolean().default(false),
  depositAmount: z.coerce.number().min(0).optional().nullable(),
  depositBank: z.string().optional().nullable(),
  depositStatus: z.enum(['AUSSTEHEND', 'HINTERLEGT', 'FREIGEGEBEN']).default('AUSSTEHEND'),
  indexierung: z.boolean().default(false),
  referenzzinssatz: z.coerce.number().min(0).max(20).optional().nullable(),
  keysCount: z.coerce.number().int().min(0).optional().nullable(),
  noticePeriodMonths: z.coerce.number().int().min(1).max(24).default(3),
})

export type LeaseFormValues = z.infer<typeof leaseSchema>
