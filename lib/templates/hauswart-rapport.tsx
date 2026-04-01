import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { pdfStyles } from './shared'

type HauswartRapportData = {
  propertyName: string
  propertyAddress: string
  monat: number
  jahr: number
  stundenansatz: number
  entries: Array<{ datum: string; kategorie: string; beschreibung: string; stunden: number | null; betrag: number | null }>
  totals: { stunden: number; stundenkosten: number; auslagen: number; total: number }
}

const monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

const s = StyleSheet.create({
  row: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', fontSize: 9 },
  head: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 8', fontSize: 9, fontWeight: 'bold' },
  c1: { width: '15%' }, c2: { width: '20%' }, c3: { width: '45%' }, c4: { width: '10%', textAlign: 'right' }, c5: { width: '10%', textAlign: 'right' },
  sum: { marginTop: 16, padding: 10, backgroundColor: '#f9fafb' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 },
  sumTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#374151', fontSize: 11, fontWeight: 'bold' },
})

export function HauswartRapportPDF({ data }: { data: HauswartRapportData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Hauswart-Rapport</Text>
          <Text style={pdfStyles.subtitle}>{monthNames[data.monat - 1]} {data.jahr}</Text>
        </View>
        <Text style={{ fontSize: 10, marginBottom: 2 }}>{data.propertyName}</Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 12 }}>{data.propertyAddress}</Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>Stundenansatz: CHF {data.stundenansatz.toFixed(2)}/h</Text>
        <View>
          <View style={s.head}>
            <Text style={s.c1}>Datum</Text><Text style={s.c2}>Kategorie</Text><Text style={s.c3}>Beschreibung</Text><Text style={s.c4}>Std.</Text><Text style={s.c5}>CHF</Text>
          </View>
          {data.entries.map((e, i) => (
            <View key={i} style={s.row}>
              <Text style={s.c1}>{e.datum}</Text><Text style={s.c2}>{e.kategorie}</Text><Text style={s.c3}>{e.beschreibung}</Text>
              <Text style={s.c4}>{e.stunden != null ? e.stunden.toFixed(1) : ''}</Text><Text style={s.c5}>{e.betrag != null ? e.betrag.toFixed(2) : ''}</Text>
            </View>
          ))}
        </View>
        <View style={s.sum}>
          <View style={s.sumRow}><Text>Stunden × CHF {data.stundenansatz.toFixed(2)}/h</Text><Text>CHF {data.totals.stundenkosten.toFixed(2)}</Text></View>
          <View style={s.sumRow}><Text>Auslagen (Spesen/Material/Fremdleistung)</Text><Text>CHF {data.totals.auslagen.toFixed(2)}</Text></View>
          <View style={s.sumTotal}><Text>Total</Text><Text>CHF {data.totals.total.toFixed(2)}</Text></View>
        </View>
      </Page>
    </Document>
  )
}
