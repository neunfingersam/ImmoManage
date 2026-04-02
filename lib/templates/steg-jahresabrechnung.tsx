import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { pdfStyles } from './shared'

type OwnerStatementData = {
  propertyName: string
  propertyAddress: string
  ownerName: string
  jahr: number
  mea: number
  totalMea: number
  kostenanteil: number
  fondsanteil: number
  vorauszahlungen: number
  saldo: number
  positionen: Array<{
    kategorie: string
    beschreibung: string
    budgetBetrag: number
    istBetrag: number
    ownerAnteil: number
  }>
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#374151' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3, fontSize: 9 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    fontSize: 10,
    fontWeight: 'bold',
  },
  saldoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 4,
  },
})

export function StegOwnerStatementPDF({ data }: { data: OwnerStatementData }) {
  const meaProzent = data.totalMea > 0 ? ((data.mea / data.totalMea) * 100).toFixed(2) : '0.00'
  const istNachzahlung = data.saldo > 0

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Jahresabrechnung {data.jahr}</Text>
          <Text style={pdfStyles.subtitle}>Eigentümergemeinschaft</Text>
        </View>

        <Text style={{ fontSize: 10, marginBottom: 2 }}>{data.propertyName}</Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 12 }}>{data.propertyAddress}</Text>

        <Text style={{ fontSize: 10, marginBottom: 2 }}>Eigentümer: {data.ownerName}</Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 16 }}>
          MEA: {data.mea} von {data.totalMea} ({meaProzent}%)
        </Text>

        {/* Kostenpositionen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kostenpositionen (Ihr Anteil {meaProzent}%)</Text>
          {data.positionen.map((pos, i) => (
            <View key={i} style={styles.row}>
              <Text style={{ flex: 1 }}>{pos.beschreibung} ({pos.kategorie})</Text>
              <Text style={{ width: 70, textAlign: 'right' }}>
                CHF {pos.ownerAnteil.toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text>Total Kostenanteil</Text>
            <Text>CHF {data.kostenanteil.toFixed(2)}</Text>
          </View>
        </View>

        {/* Fondsbeitrag */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Erneuerungsfonds</Text>
          <View style={styles.row}>
            <Text>Ihr Fondsbeitrag ({meaProzent}%)</Text>
            <Text>CHF {data.fondsanteil.toFixed(2)}</Text>
          </View>
        </View>

        {/* Vorauszahlungen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vorauszahlungen</Text>
          <View style={styles.row}>
            <Text>Bezahlte Vorauszahlungen {data.jahr}</Text>
            <Text>CHF {data.vorauszahlungen.toFixed(2)}</Text>
          </View>
        </View>

        {/* Saldo */}
        <View style={[styles.saldoBox, { backgroundColor: istNachzahlung ? '#fef2f2' : '#f0fdf4' }]}>
          <View style={styles.totalRow}>
            <Text style={{ color: istNachzahlung ? '#dc2626' : '#16a34a' }}>
              {istNachzahlung ? 'Nachzahlung' : 'Rückerstattung'}
            </Text>
            <Text style={{ color: istNachzahlung ? '#dc2626' : '#16a34a' }}>
              CHF {Math.abs(data.saldo).toFixed(2)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
