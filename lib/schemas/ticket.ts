import { z } from 'zod'

export const ticketSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  propertyId: z.string().min(1, 'Immobilie ist erforderlich'),
  unitId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  scope: z.enum(['UNIT', 'BUILDING']).default('UNIT'),
  images: z.array(z.string()).optional().default([]),
})

export const commentSchema = z.object({
  text: z.string().min(1, 'Kommentar darf nicht leer sein'),
})

export const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']),
})

export type TicketFormValues = z.infer<typeof ticketSchema>
export type CommentFormValues = z.infer<typeof commentSchema>
export type UpdateStatusValues = z.infer<typeof updateStatusSchema>
