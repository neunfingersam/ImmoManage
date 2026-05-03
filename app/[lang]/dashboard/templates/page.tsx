// app/[lang]/dashboard/templates/page.tsx
import { getTranslations } from 'next-intl/server'
import { getTemplateTexts } from './_actions'
import { TemplateEditor } from './TemplateEditor'

const TEMPLATES = [
  { key: 'mietvertrag', icon: '📄' },
  { key: 'uebergabeprotokoll', icon: '🏠' },
  { key: 'kuendigung', icon: '📮' },
  { key: 'nebenkostenabrechnung', icon: '🧾' },
  { key: 'mahnung1', icon: '⚠️' },
  { key: 'mahnung2', icon: '🔴' },
  { key: 'mahnung3', icon: '🚨' },
] as const

// Default placeholder texts shown when no custom text has been saved
const DEFAULT_TEXTS: Record<string, Record<string, string>> = {
  mietvertrag: {
    de: 'Sehr geehrte/r {mieterName},\n\nhiermit bestätigen wir den Abschluss des Mietvertrags für die Wohnung {einheit} an der {objektAdresse} ab {startDatum}.\n\nNettomiete: CHF {kaltmiete}/Monat\nNebenkosten à-konto: CHF {nebenkosten}/Monat\nKaution: CHF {kaution}\n\nMit freundlichen Grüssen\n{vermieterName}',
    fr: 'Madame, Monsieur {mieterName},\n\nnous confirmons par la présente la conclusion du contrat de bail pour l\'appartement {einheit} à l\'adresse {objektAdresse} à partir du {startDatum}.\n\nLoyer net: CHF {kaltmiete}/mois\nCharges à compte: CHF {nebenkosten}/mois\nGarantie: CHF {kaution}\n\nCordialement\n{vermieterName}',
    en: 'Dear {mieterName},\n\nWe hereby confirm the conclusion of the rental agreement for apartment {einheit} at {objektAdresse} from {startDatum}.\n\nNet rent: CHF {kaltmiete}/month\nUtilities on account: CHF {nebenkosten}/month\nDeposit: CHF {kaution}\n\nYours sincerely\n{vermieterName}',
    it: 'Gentile {mieterName},\n\ncon la presente confermiamo la conclusione del contratto di locazione per l\'appartamento {einheit} presso {objektAdresse} a partire da {startDatum}.\n\nAffitto netto: CHF {kaltmiete}/mese\nSpese accessorie: CHF {nebenkosten}/mese\nCaparra: CHF {kaution}\n\nDistinti saluti\n{vermieterName}',
  },
  uebergabeprotokoll: {
    de: 'Übergabeprotokoll für die Wohnung {einheit} an der {objektAdresse}.\n\nDatum: {datum}\nMieter/in: {mieterName}\nVermieter: {vermieterName}\n\nDie Wohnung wurde in folgendem Zustand übergeben:',
    fr: 'Procès-verbal de remise pour l\'appartement {einheit} à {objektAdresse}.\n\nDate: {datum}\nLocataire: {mieterName}\nBailleur: {vermieterName}\n\nL\'appartement a été remis dans l\'état suivant:',
    en: 'Handover protocol for apartment {einheit} at {objektAdresse}.\n\nDate: {datum}\nTenant: {mieterName}\nLandlord: {vermieterName}\n\nThe apartment was handed over in the following condition:',
    it: 'Verbale di consegna per l\'appartamento {einheit} presso {objektAdresse}.\n\nData: {datum}\nInquilino: {mieterName}\nLocatore: {vermieterName}\n\nL\'appartamento è stato consegnato nelle seguenti condizioni:',
  },
  kuendigung: {
    de: 'Sehr geehrte/r {mieterName},\n\nmit diesem Schreiben kündigen wir das Mietverhältnis für die Wohnung {einheit} an der {objektAdresse} per {kuendigungsDatum}.\n\nWir bitten Sie, die Wohnung bis zu diesem Datum geräumt und gereinigt zu übergeben.\n\nMit freundlichen Grüssen\n{vermieterName}',
    fr: 'Madame, Monsieur {mieterName},\n\npar la présente, nous résilions le bail pour l\'appartement {einheit} à {objektAdresse} pour le {kuendigungsDatum}.\n\nNous vous prions de restituer l\'appartement vide et propre à cette date.\n\nCordialement\n{vermieterName}',
    en: 'Dear {mieterName},\n\nWe hereby terminate the tenancy for apartment {einheit} at {objektAdresse} as of {kuendigungsDatum}.\n\nPlease ensure the apartment is vacated and cleaned by this date.\n\nYours sincerely\n{vermieterName}',
    it: 'Gentile {mieterName},\n\ncon la presente disdiciamo il contratto di locazione per l\'appartamento {einheit} presso {objektAdresse} per il {kuendigungsDatum}.\n\nLa preghiamo di riconsegnare l\'appartamento sgomberato e pulito entro tale data.\n\nDistinti saluti\n{vermieterName}',
  },
  nebenkostenabrechnung: {
    de: 'Sehr geehrte/r {mieterName},\n\nwir übersenden Ihnen die Nebenkostenabrechnung für die Wohnung {einheit} an der {objektAdresse} für den Zeitraum {zeitraum}.\n\nGesamtbetrag Mieter/in: CHF {betrag}\n\nBitte überweisen Sie den Differenzbetrag bis in 30 Tagen.\n\nMit freundlichen Grüssen\n{vermieterName}',
    fr: 'Madame, Monsieur {mieterName},\n\nveuillez trouver ci-joint le décompte des charges pour l\'appartement {einheit} à {objektAdresse} pour la période {zeitraum}.\n\nMontant total locataire: CHF {betrag}\n\nCordialement\n{vermieterName}',
    en: 'Dear {mieterName},\n\nPlease find enclosed the utility bill for apartment {einheit} at {objektAdresse} for the period {zeitraum}.\n\nTotal amount: CHF {betrag}\n\nYours sincerely\n{vermieterName}',
    it: 'Gentile {mieterName},\n\nLe trasmettiamo il conteggio delle spese accessorie per l\'appartamento {einheit} presso {objektAdresse} per il periodo {zeitraum}.\n\nImporto totale: CHF {betrag}\n\nDistinti saluti\n{vermieterName}',
  },
  mahnung1: {
    de: 'Sehr geehrte/r {mieterName},\n\ngemäss unseren Unterlagen ist der Mietzins für {monat} in der Höhe von CHF {betrag} noch nicht bei uns eingegangen. Wir bitten Sie, den ausstehenden Betrag bis am {faelligAm} auf unser Konto zu überweisen.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.',
    fr: 'Madame, Monsieur {mieterName},\n\nselon nos registres, le loyer de {monat} d\'un montant de CHF {betrag} n\'a pas encore été reçu. Nous vous prions de bien vouloir verser le montant dû avant le {faelligAm}.',
    en: 'Dear {mieterName},\n\nAccording to our records, the rent for {monat} amounting to CHF {betrag} has not yet been received. Please transfer the outstanding amount by {faelligAm}.',
    it: 'Gentile {mieterName},\n\nSecondo i nostri registri, l\'affitto per {monat} di CHF {betrag} non è ancora stato ricevuto. La preghiamo di versare l\'importo dovuto entro il {faelligAm}.',
  },
  mahnung2: {
    de: 'Sehr geehrte/r {mieterName},\n\ntrotz unserer Zahlungserinnerung ist der Mietzins für {monat} in der Höhe von CHF {betrag} noch immer ausstehend. Wir fordern Sie dringend auf, diesen Betrag bis am {faelligAm} zu begleichen. Andernfalls sehen wir uns gezwungen, weitere Schritte einzuleiten.',
    fr: 'Madame, Monsieur {mieterName},\n\nmalgré notre premier rappel, le loyer de {monat} de CHF {betrag} est toujours impayé. Nous vous demandons instamment de régler ce montant avant le {faelligAm}.',
    en: 'Dear {mieterName},\n\nDespite our previous reminder, the rent for {monat} of CHF {betrag} is still outstanding. We urgently request you to settle this amount by {faelligAm}.',
    it: 'Gentile {mieterName},\n\nNonostante il nostro primo sollecito, l\'affitto per {monat} di CHF {betrag} è ancora in sospeso. La invitiamo urgentemente a saldare questo importo entro il {faelligAm}.',
  },
  mahnung3: {
    de: 'Sehr geehrte/r {mieterName},\n\nDies ist unsere letzte Mahnung bezüglich des ausstehenden Mietzinses für {monat} in der Höhe von CHF {betrag}. Falls Sie den Betrag nicht bis am {faelligAm} bezahlen, werden wir rechtliche Schritte einleiten und das Mietverhältnis fristlos kündigen.',
    fr: 'Madame, Monsieur {mieterName},\n\nCeci est notre dernier rappel concernant le loyer impayé de {monat} de CHF {betrag}. Si vous ne réglez pas ce montant avant le {faelligAm}, nous nous verrons contraints d\'engager des procédures légales.',
    en: 'Dear {mieterName},\n\nThis is our final notice regarding the outstanding rent for {monat} of CHF {betrag}. If payment is not received by {faelligAm}, we will initiate legal proceedings and terminate the tenancy with immediate effect.',
    it: 'Gentile {mieterName},\n\nQuesto è il nostro ultimo sollecito riguardo all\'affitto non pagato per {monat} di CHF {betrag}. Se il pagamento non viene effettuato entro il {faelligAm}, avvieremo procedimenti legali.',
  },
}

export default async function TemplatesPage() {
  const [t, savedTexts] = await Promise.all([
    getTranslations('templates'),
    getTemplateTexts(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Passen Sie die Vorlagentexte für Ihr Unternehmen an. Platzhalter (z.B. {'{mieterName}'}) werden automatisch befüllt.
        </p>
      </div>

      <div className="space-y-4">
        {TEMPLATES.map(({ key, icon }) => (
          <TemplateEditor
            key={key}
            templateKey={key}
            icon={icon}
            initialTexts={savedTexts}
            defaultTexts={DEFAULT_TEXTS[key] ?? {}}
          />
        ))}

        {/* Data import template */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📥</span>
            <h3 className="font-semibold">{t('importVorlage')}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('importVorlageDesc')}</p>
          <a
            href="/templates/import-vorlage.xlsx"
            download
            className="inline-flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors font-medium"
          >
            ↓ import-vorlage.xlsx
          </a>
        </div>
      </div>
    </div>
  )
}
