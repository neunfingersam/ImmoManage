'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

type RenewalItem = {
  bauteil: string
  restlebensdauer: number | null
  erneuerungskosten: number | null
  letzteErneuerung: number | null
}

export type AmpelStatus = 'gruen' | 'gelb' | 'rot'

type Props = {
  propertyName: string
  kanton: string | null
  fondsStand: number | null
  fondsBeitragssatz: number
  ampelStatus: AmpelStatus
  renewalItems: RenewalItem[]
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, borderBottom: '1 solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { color: '#666' },
  value: { fontFamily: 'Helvetica-Bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '4 6', marginBottom: 2 },
  tableRow: { flexDirection: 'row', padding: '4 6', borderBottom: '1 solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  ampelGruen: { color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  ampelGelb: { color: '#d97706', fontFamily: 'Helvetica-Bold' },
  ampelRot: { color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8 },
})

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function ampelLabel(s: AmpelStatus) {
  return s === 'gruen' ? '● Gut gedeckt' : s === 'gelb' ? '● Teilweise gedeckt' : '● Unterdeckt'
}

function PdfDocument({ propertyName, kanton, fondsStand, fondsBeitragssatz, ampelStatus, renewalItems }: Props) {
  const currentYear = new Date().getFullYear()
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Erneuerungsfonds-Bericht</Text>
        <Text style={styles.subtitle}>
          {propertyName}{kanton ? ` · ${kanton}` : ''} · {new Date().toLocaleDateString('de-CH')}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Übersicht</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Aktueller Fondsstand</Text>
            <Text style={styles.value}>CHF {fondsStand != null ? fmt(fondsStand) : '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Beitragssatz</Text>
            <Text style={styles.value}>{fondsBeitragssatz} % / Jahr</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Deckungsgrad (nächste 5 Jahre)</Text>
            <Text style={ampelStatus === 'gruen' ? styles.ampelGruen : ampelStatus === 'gelb' ? styles.ampelGelb : styles.ampelRot}>
              {ampelLabel(ampelStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Erneuerungsplan</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Bauteil</Text>
            <Text style={styles.col2}>Letzte Ern.</Text>
            <Text style={styles.col3}>Fällig</Text>
            <Text style={styles.col4}>Kosten (CHF)</Text>
          </View>
          {renewalItems.length === 0 ? (
            <Text style={{ color: '#999', padding: 6 }}>Keine Einträge</Text>
          ) : renewalItems.map((item, i) => {
            const base = item.letzteErneuerung ?? currentYear
            const due = item.restlebensdauer != null ? base + item.restlebensdauer : null
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{item.bauteil}</Text>
                <Text style={styles.col2}>{item.letzteErneuerung ?? '—'}</Text>
                <Text style={styles.col3}>{due ?? '—'}</Text>
                <Text style={styles.col4}>{item.erneuerungskosten != null ? fmt(item.erneuerungskosten) : '—'}</Text>
              </View>
            )
          })}
        </View>

        <Text style={styles.footer}>Erstellt mit ImmoManage · {new Date().toLocaleDateString('de-CH')}</Text>
      </Page>
    </Document>
  )
}

export function FondsPdfButton(props: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const blob = await pdf(<PdfDocument {...props} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Erneuerungsfonds-${props.propertyName.replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileDown className="h-4 w-4 mr-1.5" />}
      PDF exportieren
    </Button>
  )
}
