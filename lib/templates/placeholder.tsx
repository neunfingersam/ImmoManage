import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, pdfStyles } from './shared'

export function CustomTextPdf({
  companyName,
  title,
  bodyText,
}: {
  companyName: string
  title: string
  bodyText: string
}) {
  return (
    <PdfLayout companyName={companyName} title={title}>
      <View style={pdfStyles.section}>
        {bodyText.split('\n').map((line, i) => (
          <Text key={i} style={line === '' ? { fontSize: 6 } : pdfStyles.paragraph}>
            {line || ' '}
          </Text>
        ))}
      </View>
      <View style={{ ...pdfStyles.signatureRow, marginTop: 40 }}>
        <View style={pdfStyles.signatureBlock}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>Datum / Unterschrift Vermieter</Text>
        </View>
        <View style={pdfStyles.signatureBlockRight}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>Datum / Unterschrift Mieter</Text>
        </View>
      </View>
    </PdfLayout>
  )
}

export function SimplePlaceholderPdf({
  companyName,
  type,
  tenantName,
  propertyAddress,
}: {
  companyName: string
  type: string
  locale: string
  tenantName: string
  propertyAddress: string
}) {
  return (
    <PdfLayout companyName={companyName} title={type}>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.paragraph}>Mieter: {tenantName}</Text>
        <Text style={pdfStyles.paragraph}>Objekt: {propertyAddress}</Text>
        <Text style={{ ...pdfStyles.paragraph, color: '#999' }}>
          [Diese Vorlage wird in einer zukünftigen Version vollständig ausgefüllt.]
        </Text>
      </View>
    </PdfLayout>
  )
}
