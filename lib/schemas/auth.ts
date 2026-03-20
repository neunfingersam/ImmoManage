// lib/schemas/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Bitte gib eine gültige E-Mail-Adresse ein.' }),
  password: z
    .string()
    .min(1, { message: 'Bitte gib dein Passwort ein.' })
    .min(6, { message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' }),
})

export type LoginInput = z.infer<typeof loginSchema>
