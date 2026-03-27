import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, SectionTitle, FieldRow, formatCHF, pdfStyles } from './shared'
import type { TaxSummary } from '@/lib/tax'
import type { TaxI18n } from '@/lib/tax-i18n'

function chf(n: number) { return formatCHF(n) }

export function SteuerberichtPdf({ data, companyName, i18n }: { data: TaxSummary; companyName: string; i18n: TaxI18n }) {
  const l = i18n

  return (
    <PdfLayout
      companyName={companyName}
      title={l.title}
      subtitleText={l.subtitle(data.year)}
    >
      {/* ── Gesamtübersicht ── */}
      <SectionTitle label={l.s_summary} />
      <FieldRow label={l.totalIncome} value={chf(data.totalIncome)} bold />
      <FieldRow
        label={l.bestMethod}
        value={data.totalTaxableIncomePauschal <= data.totalTaxableIncomeEffektiv
          ? `${l.rec_pauschal} (${chf(data.totalPauschalAbzug)})`
          : `${l.rec_effektiv} (${chf(data.totalRepairCosts)})`}
        bold
      />
      <FieldRow label={l.taxableIncome} value={chf(data.totalTaxableIncome)} bold />

      {/* ── Pro Liegenschaft ── */}
      {data.properties.map((prop) => (
        <View key={prop.propertyId}>
          <SectionTitle label={l.s_property(prop.propertyName)} />
          <FieldRow label={l.address} value={prop.propertyAddress} />
          {prop.buildingYear && <FieldRow label={l.buildingYear} value={String(prop.buildingYear)} />}
          <View style={pdfStyles.divider} />

          <FieldRow label={l.grossRent} value={chf(prop.grossRentalIncome)} />
          <FieldRow label={l.extraCosts} value={chf(prop.extraCostsIncome)} />
          <FieldRow label={l.totalInc} value={chf(prop.totalIncome)} bold />
          {prop.vacancyLoss > 0 && <FieldRow label={l.vacancy} value={`– ${chf(prop.vacancyLoss)}`} />}

          <View style={pdfStyles.divider} />

          <FieldRow label={`${l.pauschalRate} (${prop.pauschalRate}%)`} value={`– ${chf(prop.pauschalAbzug)}`} />
          <FieldRow label={l.repairCosts} value={`– ${chf(prop.repairCosts)}`} />

          <View style={pdfStyles.divider} />

          <FieldRow label={l.taxablePauschal} value={chf(prop.taxableIncomePauschal)} />
          <FieldRow label={l.taxableEffektiv} value={chf(prop.taxableIncomeEffektiv)} />

          {/* Recommendation box */}
          <View style={[
            prop.recommendation === 'pauschal' ? pdfStyles.infoBox : pdfStyles.warningBox,
            { marginTop: 4 }
          ]}>
            <Text style={prop.recommendation === 'pauschal' ? pdfStyles.infoText : pdfStyles.warningText}>
              {prop.recommendation === 'pauschal' ? l.rec_pauschal : l.rec_effektiv}
              {' → '}{l.taxableIncome}: {chf(prop.taxableIncome)}
            </Text>
          </View>

          {/* Units table */}
          {prop.units.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[pdfStyles.note, { marginBottom: 3, fontFamily: 'Helvetica-Bold' }]}>{l.s_units}</Text>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>{l.colUnit}</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1.5 }]}>{l.colTenant}</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 0.6, textAlign: 'right' }]}>{l.colMonths}</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>{l.colRent}</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>{l.colExtra}</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>{l.colTotal}</Text>
              </View>
              {prop.units.map((u, i) => (
                <View key={u.unitId} style={i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                  <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{u.unitNumber}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>{u.tenantName ?? '—'}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 0.6, textAlign: 'right' }]}>{u.months}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{chf(u.annualRent)}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{chf(u.annualExtra)}</Text>
                  <Text style={[pdfStyles.tableCellBold, { flex: 1.2, textAlign: 'right' }]}>{chf(u.annualRent + u.annualExtra)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* ── Hinweise ── */}
      <SectionTitle label={l.s_note} />
      <Text style={pdfStyles.note}>{l.note1}</Text>
      <Text style={pdfStyles.note}>{l.note2}</Text>
      <Text style={pdfStyles.note}>{l.note3}</Text>
      <Text style={pdfStyles.note}>{l.note4}</Text>

      {/* Signature */}
      <View style={pdfStyles.signatureRow}>
        <View style={pdfStyles.signatureBlock}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>Ort, Datum</Text>
        </View>
        <View style={pdfStyles.signatureBlockRight}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>Unterschrift Vermieter/Verwaltung</Text>
        </View>
      </View>
    </PdfLayout>
  )
}
