import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: { padding: 52, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  // Header
  headerBar: { backgroundColor: '#1e3a5f', padding: '10 14', marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  headerCompany: { fontSize: 8.5, color: '#c8d8ee' },
  pageSubtitle: { fontSize: 8.5, color: '#666', marginBottom: 10, marginTop: -4 },
  // Section headings
  sectionTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1e3a5f', marginBottom: 5, marginTop: 12, borderBottom: '1pt solid #1e3a5f', paddingBottom: 2 },
  // Field rows
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { fontSize: 9, color: '#555', width: 160, flexShrink: 0 },
  value: { fontSize: 10, flex: 1 },
  valueBold: { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  // Two-column layout
  col2: { flexDirection: 'row' },
  col: { flex: 1 },
  colRight: { flex: 1, marginLeft: 16 },
  colLabel: { fontSize: 8, color: '#888', marginBottom: 2 },
  colValue: { fontSize: 10, marginBottom: 1 },
  colValueBold: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  // Tables
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: '4 5' },
  tableHeaderCell: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #e5e7eb', padding: '3 5' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: '#f7f9fb', borderBottom: '0.5pt solid #e5e7eb', padding: '3 5' },
  tableCell: { fontSize: 9 },
  tableCellBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableFooter: { flexDirection: 'row', backgroundColor: '#e8edf4', borderTop: '1pt solid #1e3a5f', padding: '5 5' },
  // Text blocks
  paragraph: { fontSize: 10, lineHeight: 1.55, marginBottom: 6 },
  note: { fontSize: 8.5, color: '#555', lineHeight: 1.45, marginBottom: 4 },
  // Boxes
  warningBox: { backgroundColor: '#fffbeb', border: '1pt solid #f59e0b', padding: '5 8', marginTop: 6, marginBottom: 6 },
  warningText: { fontSize: 8.5, color: '#78350f', lineHeight: 1.5 },
  infoBox: { backgroundColor: '#eff6ff', border: '0.5pt solid #93c5fd', padding: '5 8', marginTop: 4, marginBottom: 4 },
  infoText: { fontSize: 8.5, color: '#1e3a8a', lineHeight: 1.5 },
  // Signatures
  signatureRow: { flexDirection: 'row', marginTop: 14 },
  signatureBlock: { flex: 1 },
  signatureBlockRight: { flex: 1, marginLeft: 24 },
  signatureLine: { borderBottom: '1pt solid #555', marginBottom: 3, marginTop: 22 },
  signatureLabel: { fontSize: 8.5, color: '#555' },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', borderTop: '0.5pt solid #d1d5db', paddingTop: 3 },
  footerText: { fontSize: 7.5, color: '#9ca3af' },
  // Misc
  divider: { borderBottom: '0.5pt solid #e5e7eb', marginTop: 6, marginBottom: 6 },
  section: { marginBottom: 3 },
  // ── Legacy keys used by mahnung.tsx ──
  header: { marginBottom: 24 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  signatureRow_legacy: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine_legacy: { width: '40%', borderBottom: '1pt solid black', paddingBottom: 2, fontSize: 9, color: '#888' },
})

interface PdfLayoutProps {
  companyName: string
  title: string
  subtitleText?: string
  children: React.ReactNode
}

export function PdfLayout({ companyName, title, subtitleText, children }: PdfLayoutProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBar} fixed>
          <Text style={pdfStyles.headerTitle}>{title}</Text>
          <Text style={pdfStyles.headerCompany}>{companyName}</Text>
        </View>
        {subtitleText ? <Text style={pdfStyles.pageSubtitle}>{subtitleText}</Text> : null}
        {children as React.ReactElement}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>{companyName}</Text>
          <Text style={pdfStyles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text style={pdfStyles.footerText}>ImmoManage</Text>
        </View>
      </Page>
    </Document>
  )
}

export function SectionTitle({ label }: { label: string }) {
  return <Text style={pdfStyles.sectionTitle}>{label.toUpperCase()}</Text>
}

export function FieldRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={pdfStyles.row}>
      <Text style={pdfStyles.label}>{label}</Text>
      <Text style={bold ? pdfStyles.valueBold : pdfStyles.value}>{value}</Text>
    </View>
  )
}

export function formatCHF(amount: number): string {
  const parts = amount.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `CHF ${parts[0]}.${parts[1]}`
}

export function formatDate(date: Date | string, locale = 'de'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const tag = locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : locale === 'en' ? 'en-GB' : 'de-CH'
  return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit', year: 'numeric' })
}
