// types/next-auth.d.ts
import type { Role } from '@/lib/generated/prisma'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      companyId: string | null
      name: string
      email: string
      mustChangePassword?: boolean
    }
  }

  interface User {
    id: string
    role: Role
    companyId: string | null
    name: string
    email: string
    mustChangePassword?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    companyId: string | null
    mustChangePassword?: boolean
  }
}
