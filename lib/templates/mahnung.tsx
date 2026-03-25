import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, pdfStyles } from './shared'

interface MahnungData {
  companyName: string
  tenantName: string
  tenantAddress: string
  propertyAddress: string
  month: string
  amount: number
  dueDate: string
  level: 1 | 2 | 3
  locale: string
}

const titles: Record<string, Record<number, string>> = {
  de: { 1: 'Zahlungserinnerung', 2: '2. Mahnung', 3: '3. Mahnung / Letzte Mahnung' },
  fr: { 1: 'Rappel de paiement', 2: '2e rappel', 3: '3e rappel / Dernier rappel' },
  en: { 1: 'Payment Reminder', 2: '2nd Reminder', 3: '3rd Reminder / Final Notice' },
  it: { 1: 'Sollecito di pagamento', 2: '2° sollecito', 3: '3° sollecito / Ultimo avviso' },
}

const bodyText: Record<string, (data: MahnungData) => string> = {
  de: (d) => `Sehr geehrte/r ${d.tenantName},\n\ngemäss unseren Unterlagen ist der Mietzins für ${d.month} in der Höhe von CHF ${d.amount.toFixed(2)} noch nicht bei uns eingegangen. Wir bitten Sie, den ausstehenden Betrag bis am ${d.dueDate} auf unser Konto zu überweisen.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.`,
  fr: (d) => `Madame, Monsieur ${d.tenantName},\n\nSelon nos registres, le loyer de ${d.month} d'un montant de CHF ${d.amount.toFixed(2)} n'a pas encore été reçu. Nous vous prions de bien vouloir verser le montant dû avant le ${d.dueDate}.\n\nNous restons à votre disposition pour toute question.`,
  en: (d) => `Dear ${d.tenantName},\n\nAccording to our records, the rent for ${d.month} amounting to CHF ${d.amount.toFixed(2)} has not yet been received. Please transfer the outstanding amount by ${d.dueDate}.\n\nPlease do not hesitate to contact us if you have any questions.`,
  it: (d) => `Gentile ${d.tenantName},\n\nSecondo i nostri registri, l'affitto per ${d.month} di CHF ${d.amount.toFixed(2)} non è ancora stato ricevuto. La preghiamo di versare l'importo dovuto entro il ${d.dueDate}.\n\nRestiamo a sua disposizione per qualsiasi domanda.`,
}

export function MahnungPdf(data: MahnungData) {
  const locale = data.locale in titles ? data.locale : 'de'
  const title = titles[locale][data.level]
  const body = bodyText[locale]?.(data) ?? bodyText.de(data)

  return (
    <PdfLayout companyName={data.companyName} title={title}>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.label}>Empfänger / Destinataire</Text>
        <Text style={pdfStyles.value}>{data.tenantName}</Text>
        <Text style={{ fontSize: 10, color: '#666' }}>{data.tenantAddress}</Text>
      </View>
      <View style={pdfStyles.section}>
        <Text style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Objekt: {data.propertyAddress}</Text>
      </View>
      <View style={pdfStyles.section}>
        {body.split('\n\n').map((para, i) => (
          <Text key={i} style={pdfStyles.paragraph}>{para}</Text>
        ))}
      </View>
      <View style={pdfStyles.signatureBlock}>
        <Text style={pdfStyles.signatureLine}>Ort / Datum</Text>
        <Text style={pdfStyles.signatureLine}>{data.companyName}</Text>
      </View>
    </PdfLayout>
  )
}
