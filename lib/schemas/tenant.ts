import { z } from 'zod'

export const tenantSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  phone: z.string().optional().nullable(),
})

export type TenantFormValues = z.infer<typeof tenantSchema>
