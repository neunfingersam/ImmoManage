'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, CheckCircle2, XCircle, Loader2, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bulkRecordPaymentsAction } from '@/app/[lang]/dashboard/payments/_actions'

// ─── Types ───────────────────────────────────────────────────────────────────

type OpenDemand = {
  id: string
  tenantName: string
  propertyName: string
  unitNumber: string
  amount: number
  month: Date
}

type CamtTransaction = {
  amount: number
  date: string
  debtorName: string
  reference: string
}

type Match = {
  demand: OpenDemand
  transaction: CamtTransaction
  selected: boolean
}

// ─── CAMT.053 Parser (client-side DOMParser) ──────────────────────────────────

function parseCamt(xmlText: string): CamtTransaction[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  // Namespace-agnostic: use getElementsByTagNameNS with wildcard
  const entries = Array.from(doc.getElementsByTagName('Ntry'))
  const result: CamtTransaction[] = []

  for (const entry of entries) {
    // Only credit entries (money coming IN)
    const cdtDbt = entry.getElementsByTagName('CdtDbtInd')[0]?.textContent?.trim()
    if (cdtDbt !== 'CRDT') continue

    const amtText = entry.getElementsByTagName('Amt')[0]?.textContent?.trim()
    const amount = amtText ? parseFloat(amtText) : 0
    if (!amount || isNaN(amount)) continue

    // Booking date
    const dt =
      entry.getElementsByTagName('BookgDt')[0]?.getElementsByTagName('Dt')[0]?.textContent?.trim() ??
      entry.getElementsByTagName('ValDt')[0]?.getElementsByTagName('Dt')[0]?.textContent?.trim() ??
      ''

    // Debtor name (inside NtryDtls/TxDtls/RltdPties/Dbtr/Nm)
    const debtorName =
      entry.getElementsByTagName('Dbtr')[0]?.getElementsByTagName('Nm')[0]?.textContent?.trim() ?? '–'

    // Unstructured reference
    const reference =
      entry.getElementsByTagName('Ustrd')[0]?.textContent?.trim() ?? ''

    result.push({ amount, date: dt, debtorName, reference })
  }

  return result
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CamtImport({ openDemands }: { openDemands: OpenDemand[] }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [unmatched, setUnmatched] = useState<CamtTransaction[]>([])
  const [step, setStep] = useState<'idle' | 'review' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const xml = e.target?.result as string
        const transactions = parseCamt(xml)
        if (transactions.length === 0) {
          setError('Keine Gutschriften (CRDT) in dieser Datei gefunden.')
          return
        }

        // Auto-match by exact amount
        const usedDemandIds = new Set<string>()
        const usedTxIndexes = new Set<number>()
        const matched: Match[] = []
        const unmatchedTx: CamtTransaction[] = []

        for (let ti = 0; ti < transactions.length; ti++) {
          const tx = transactions[ti]
          const demand = openDemands.find(
            (d) => !usedDemandIds.has(d.id) && Math.abs(d.amount - tx.amount) < 0.01
          )
          if (demand) {
            usedDemandIds.add(demand.id)
            usedTxIndexes.add(ti)
            matched.push({ demand, transaction: tx, selected: true })
          } else {
            unmatchedTx.push(tx)
          }
        }

        setMatches(matched)
        setUnmatched(unmatchedTx)
        setStep('review')
      } catch {
        setError('Datei konnte nicht verarbeitet werden. Bitte CAMT.053 XML hochladen.')
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  function toggleMatch(i: number) {
    setMatches((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, selected: !m.selected } : m))
    )
  }

  function confirm() {
    const toBook = matches
      .filter((m) => m.selected)
      .map((m) => ({
        rentDemandId: m.demand.id,
        amount: m.transaction.amount,
        paymentDate: m.transaction.date
          ? new Date(m.transaction.date).toISOString()
          : new Date().toISOString(),
        note: `CAMT-Import: ${m.transaction.debtorName}`,
      }))

    startTransition(async () => {
      await bulkRecordPaymentsAction(toBook)
      setStep('done')
    })
  }

  function reset() {
    setMatches([])
    setUnmatched([])
    setStep('idle')
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Idle: File drop zone ──────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="space-y-3">
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">CAMT.053 XML hochladen</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kontoauszug aus E-Banking exportieren (XML / CAMT.053) und hier ablegen
            </p>
          </div>
          <Button variant="outline" size="sm" type="button">
            Datei auswählen
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
    const count = matches.filter((m) => m.selected).length
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-400">
            {count} Zahlung{count !== 1 ? 'en' : ''} erfolgreich verbucht
          </p>
          <button onClick={reset} className="text-xs text-green-600 hover:underline mt-0.5">
            Weitere Datei importieren
          </button>
        </div>
      </div>
    )
  }

  // ── Review: Show matches ──────────────────────────────────────────────────
  const selectedCount = matches.filter((m) => m.selected).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {matches.length} Treffer gefunden
            {unmatched.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                · {unmatched.length} ohne Zuordnung
              </span>
            )}
          </span>
        </div>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
          Zurücksetzen
        </button>
      </div>

      {matches.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">
          Keine offenen Sollstellungen konnten mit den Transaktionen abgeglichen werden.
          Möglicherweise sind alle bereits bezahlt oder die Beträge stimmen nicht überein.
        </div>
      )}

      {matches.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 w-8" />
                <th className="p-3 text-left">Mieter</th>
                <th className="p-3 text-left">Einheit</th>
                <th className="p-3 text-right">Betrag</th>
                <th className="p-3 text-left">Eingang von</th>
                <th className="p-3 text-left">Datum</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr
                  key={i}
                  className={`border-t cursor-pointer transition-colors ${
                    m.selected ? 'bg-green-50/50 dark:bg-green-900/10' : 'opacity-50'
                  }`}
                  onClick={() => toggleMatch(i)}
                >
                  <td className="p-3">
                    {m.selected ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="p-3 font-medium">{m.demand.tenantName}</td>
                  <td className="p-3 text-muted-foreground">
                    {m.demand.propertyName} / {m.demand.unitNumber}
                  </td>
                  <td className="p-3 text-right font-mono">
                    CHF {m.transaction.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-muted-foreground truncate max-w-[160px]">
                    {m.transaction.debtorName}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {m.transaction.date
                      ? new Date(m.transaction.date).toLocaleDateString('de-CH')
                      : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {unmatched.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            {unmatched.length} Transaktion{unmatched.length !== 1 ? 'en' : ''} ohne Treffer anzeigen
          </summary>
          <ul className="mt-2 space-y-1 pl-3">
            {unmatched.map((tx, i) => (
              <li key={i}>
                {tx.date} · CHF {tx.amount.toFixed(2)} · {tx.debtorName}
              </li>
            ))}
          </ul>
        </details>
      )}

      {matches.length > 0 && (
        <div className="flex items-center gap-3">
          <Button onClick={confirm} disabled={isPending || selectedCount === 0}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verbuche...</>
            ) : (
              `${selectedCount} Zahlung${selectedCount !== 1 ? 'en' : ''} bestätigen`
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Klicke auf eine Zeile um sie ein-/auszuschliessen
          </span>
        </div>
      )}
    </div>
  )
}
