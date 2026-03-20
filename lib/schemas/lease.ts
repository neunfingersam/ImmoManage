import { z } from 'zod'

export const leaseSchema = z.object({
  unitId: z.string().min(1, 'Einheit ist erforderlich'),
  tenantId: z.string().min(1, 'Mieter ist erforderlich'),
  startDate: z.string().min(1, 'Startdatum ist erforderlich'),
  endDate: z.string().optional().nullable(),
  coldRent: z.coerce.number().min(0, 'Kaltmiete darf nicht negativ sein'),
  extraCosts: z.coerce.number().min(0, 'Nebenkosten dürfen nicht negativ sein'),
  depositPaid: z.boolean().default(false),
})

export type LeaseFormValues = z.infer<typeof leaseSchema>
