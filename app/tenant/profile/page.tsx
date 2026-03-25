import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, whatsapp: true },
  })
  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Mein Profil</h1>
        <p className="text-sm text-muted-foreground mt-1">Kontaktdaten aktualisieren</p>
      </div>
      <ProfileForm
        defaultValues={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          whatsapp: user.whatsapp ?? '',
        }}
      />
    </div>
  )
}
