// app/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  switch (session.user.role) {
    case 'SUPER_ADMIN':
      redirect('/superadmin')
    case 'ADMIN':
    case 'VERMIETER':
      redirect('/dashboard')
    case 'MIETER':
      redirect('/tenant')
    default:
      redirect('/auth/login')
  }
}
