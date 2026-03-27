import { z } from 'zod'

// Base: fields shared across create + update forms
const tenantBase = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
})

// Create: no password — tenant sets it themselves via invite email
export const tenantSchema = tenantBase.omit({ whatsapp: true })

export type TenantFormValues = z.infer<typeof tenantSchema>

// Update (by admin/vermieter): no password
export const updateTenantSchema = tenantBase
export type UpdateTenantValues = z.infer<typeof updateTenantSchema>

// Update (by tenant themselves via profile page): same fields
export const updateProfileSchema = tenantBase
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>
