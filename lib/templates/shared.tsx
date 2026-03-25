import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11 },
  header: { marginBottom: 30 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: '#888', marginBottom: 2 },
  value: { fontSize: 11, borderBottom: '1pt solid #ddd', paddingBottom: 4, marginBottom: 10 },
  paragraph: { lineHeight: 1.6, marginBottom: 8 },
  signatureBlock: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { width: '40%', borderBottom: '1pt solid black', paddingBottom: 2, fontSize: 9, color: '#888' },
  footer: { position: 'absolute', bottom: 30, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#aaa' },
})

interface PdfLayoutProps {
  companyName: string
  children: React.ReactNode
  title: string
}

export function PdfLayout({ companyName, title, children }: PdfLayoutProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{title}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>{companyName}</Text>
        </View>
        {children as React.ReactElement}
        <Text style={pdfStyles.footer} fixed>
          {companyName} • Erstellt mit ImmoManage
        </Text>
      </Page>
    </Document>
  )
}
