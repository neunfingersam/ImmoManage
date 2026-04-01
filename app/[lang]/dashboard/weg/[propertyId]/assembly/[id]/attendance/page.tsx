import { notFound } from 'next/navigation'
import { getAssemblyWithAttendance, sendAssemblyInvitation } from './_actions'
import AttendanceForm from './form'

export default async function AttendancePage({ params }: {
  params: Promise<{ lang: string; propertyId: string; id: string }>
}) {
  const { lang, propertyId, id } = await params
  const assembly = await getAssemblyWithAttendance(id)
  if (!assembly) notFound()

  const property = assembly.wegConfig.property
  const owners = property.owners
  const attendanceMap = new Map(assembly.attendance.map((a) => [a.ownerId, a]))

  const anwesend = assembly.attendance.filter((a) => a.anwesend).length
  const vertreten = assembly.attendance.filter((a) => !a.anwesend && a.vertretenDurch).length
  const totalMea = owners.reduce((s, o) => s + (o.mea ?? 0), 0)
  const anwesendMea = assembly.attendance
    .filter((a) => a.anwesend || a.vertretenDurch)
    .reduce((s, a) => s + (owners.find((o) => o.id === a.ownerId)?.mea ?? 0), 0)

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Anwesenheitsliste</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {new Date(assembly.datum).toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Eigentümer total', value: owners.length },
          { label: 'Anwesend', value: anwesend },
          { label: 'Vertreten', value: vertreten },
          { label: 'MEA anwesend', value: `${anwesendMea}/${totalMea}` },
        ].map((item) => (
          <div key={item.label} className="rounded border p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      {assembly.einladungVersandtAt ? (
        <p className="mb-4 text-sm text-green-600">
          ✓ Einladung versandt am {new Date(assembly.einladungVersandtAt).toLocaleDateString('de-CH')}
        </p>
      ) : (
        <form action={async () => { 'use server'; await sendAssemblyInvitation(id) }}>
          <button type="submit" className="mb-4 rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Einladung an alle Eigentümer versenden
          </button>
        </form>
      )}

      <AttendanceForm
        owners={owners.map(o => ({ id: o.id, mea: o.mea ?? 0, userName: o.user.name ?? '' }))}
        attendanceMap={Object.fromEntries(attendanceMap.entries())}
        assemblyId={id}
      />
    </div>
  )
}
