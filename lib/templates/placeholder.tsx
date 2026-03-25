import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, pdfStyles } from './shared'

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
