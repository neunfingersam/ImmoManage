import { z } from 'zod'

export const messageSchema = z.object({
  toId: z.string().min(1, 'Empfänger ist erforderlich'),
  text: z.string().min(1, 'Nachricht darf nicht leer sein'),
})

export type MessageFormValues = z.infer<typeof messageSchema>
