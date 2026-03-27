import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, SectionTitle, FieldRow, formatDate, pdfStyles } from './shared'

export interface KuendigungData {
  locale: string
  companyName: string
  /** 'vermieter' = landlord terminates | 'mieter' = tenant terminates */
  direction: 'vermieter' | 'mieter'
  landlordName: string
  landlordAddress: string
  tenantName: string
  tenantAddress: string
  propertyAddress: string
  unitNumber: string
  /** Date the notice is issued */
  noticeDate: string
  /** Effective termination date (must be an ortsüblicher Termin) */
  terminationDate: string
  reason?: string | null
  /** Reference rate at time of notice (for landlord notices) */
  referenzzinssatz?: number | null
}

type L = Record<string, string>

const i18n: Record<string, L> = {
  de: {
    title_vermieter: 'Kündigung des Mietvertrags',
    title_mieter: 'Kündigung des Mietvertrags',
    subtitle_vermieter: 'Amtliches Formular (OR Art. 266l/266o)',
    subtitle_mieter: 'Kündigungsschreiben (OR Art. 266a)',
    s_sender: 'ABSENDER (VERMIETER / VERWALTUNG)',
    s_recipient: 'EMPFÄNGER (MIETER/IN)',
    s_sender_m: 'ABSENDER (MIETER/IN)',
    s_recipient_m: 'EMPFÄNGER (VERMIETER / VERWALTUNG)',
    s_object: 'MIETOBJEKT',
    address: 'Adresse',
    unit: 'Wohnung / Einheit',
    s_notice: 'KÜNDIGUNG',
    notice_date: 'Datum der Kündigung',
    termination_date: 'Kündigungstermin',
    notice_period: 'Kündigungsfrist',
    notice_period_val: '3 Monate (OR Art. 266a)',
    term_dates: 'Ortsüblicher Termin',
    term_dates_val: '31. März oder 30. September',
    reason_label: 'Begründung',
    reason_none: '(keine spezifische Begründung angegeben)',
    body_vermieter: 'Hiermit kündigt die Vermieterschaft das oben aufgeführte Mietverhältnis fristgemäss auf den nachstehend aufgeführten Kündigungstermin. Die Kündigung erfolgt unter Einhaltung der gesetzlichen Kündigungsfrist von 3 Monaten auf den nächsten ortsüblichen Termin gemäss OR Art. 266a.',
    body_mieter: 'Hiermit kündige ich das oben aufgeführte Mietverhältnis fristgemäss auf den nachstehend aufgeführten Kündigungstermin. Die Kündigung erfolgt unter Einhaltung der gesetzlichen Kündigungsfrist von 3 Monaten auf den nächsten ortsüblichen Termin gemäss OR Art. 266a.',
    s_rights: 'HINWEISE UND RECHTSBELEHRUNG',
    rights_vermieter: 'Der Mieter kann die Kündigung innert 30 Tagen seit Empfang bei der zuständigen Schlichtungsbehörde für Mietsachen anfechten (OR Art. 273). Er kann zudem eine Erstreckung des Mietverhältnisses beantragen. Die Kündigung einer Familienwohnung muss beiden Ehegatten/eingetragenen Partnern zugestellt werden (OR Art. 266m/n).',
    rights_mieter: 'Der Mieter ist berechtigt, das Mietobjekt bei Vorliegen eines geeigneten Nachmieters vorzeitig zurückzugeben (OR Art. 264). Die Schlüssel sind am letzten Miettag vollständig zurückzugeben. Eine Wohnungsübergabe findet statt und wird protokolliert.',
    s_return: 'WOHNUNGSRÜCKGABE',
    return_note: 'Die Wohnung ist am Kündigungstermin besenrein, vollständig geräumt und mit sämtlichen Schlüsseln zurückzugeben. Allfällige Schäden über die normale Abnutzung gehen zu Lasten des Mieters (OR Art. 267a). Eine Schlussabrechnung der Nebenkosten wird nach Rückgabe erstellt.',
    ref_rate: 'Referenzzinssatz bei Kündigung',
    s_sigs: 'UNTERSCHRIFTEN',
    place_date: 'Ort, Datum',
    sig_landlord: 'Unterschrift Vermieter / Verwaltung',
    sig_tenant: 'Unterschrift Mieter/in',
    warning_v: 'Die Kündigung durch den Vermieter muss auf dem amtlichen Formular erfolgen (OR Art. 266l). Dieses Dokument gilt als amtliches Formular.',
    warning_m: 'Kündigung des Mieters – kein amtliches Formular erforderlich.',
  },
  fr: {
    title_vermieter: 'Résiliation du bail',
    title_mieter: 'Résiliation du bail',
    subtitle_vermieter: 'Formule officielle (CO Art. 266l/266o)',
    subtitle_mieter: 'Lettre de résiliation (CO Art. 266a)',
    s_sender: 'EXPÉDITEUR (BAILLEUR / GÉRANCE)',
    s_recipient: 'DESTINATAIRE (LOCATAIRE)',
    s_sender_m: 'EXPÉDITEUR (LOCATAIRE)',
    s_recipient_m: 'DESTINATAIRE (BAILLEUR / GÉRANCE)',
    s_object: "OBJET LOUÉ",
    address: 'Adresse',
    unit: 'Appartement / Unité',
    s_notice: 'RÉSILIATION',
    notice_date: 'Date de résiliation',
    termination_date: 'Échéance de résiliation',
    notice_period: 'Délai de résiliation',
    notice_period_val: '3 mois (CO Art. 266a)',
    term_dates: 'Échéance réglementaire',
    term_dates_val: '31 mars ou 30 septembre',
    reason_label: 'Motif',
    reason_none: '(aucun motif spécifique indiqué)',
    body_vermieter: "Par la présente, le bailleur résilie le contrat de bail mentionné ci-dessus au terme réglementaire indiqué, en respectant le délai de résiliation légal de 3 mois selon CO Art. 266a.",
    body_mieter: "Par la présente, je résilie le contrat de bail mentionné ci-dessus au terme réglementaire indiqué, en respectant le délai de résiliation légal de 3 mois selon CO Art. 266a.",
    s_rights: 'INFORMATIONS ET VOIES DE DROIT',
    rights_vermieter: "Le locataire peut contester la résiliation dans les 30 jours suivant sa réception auprès de l'autorité de conciliation compétente (CO Art. 273). Il peut également demander une prolongation du bail. La résiliation d'un logement familial doit être notifiée aux deux conjoints/partenaires enregistrés (CO Art. 266m/n).",
    rights_mieter: "Le locataire a le droit de restituer l'objet loué avant terme s'il présente un remplaçant solvable (CO Art. 264). Les clés doivent être remises intégralement le dernier jour du bail. Un état des lieux de sortie sera effectué.",
    s_return: 'RESTITUTION DU LOGEMENT',
    return_note: "Le logement doit être restitué au terme de résiliation, propre, entièrement vidé et avec toutes les clés. Les dommages dépassant l'usure normale sont à la charge du locataire (CO Art. 267a). Un décompte final des charges sera établi après restitution.",
    ref_rate: 'Taux hypothécaire de référence à la résiliation',
    s_sigs: 'SIGNATURES',
    place_date: 'Lieu, date',
    sig_landlord: 'Signature bailleur / gérance',
    sig_tenant: 'Signature locataire',
    warning_v: "La résiliation par le bailleur doit être effectuée sur formule officielle (CO Art. 266l). Ce document vaut formule officielle.",
    warning_m: "Résiliation par le locataire – pas de formule officielle requise.",
  },
  en: {
    title_vermieter: 'Notice of Termination',
    title_mieter: 'Notice of Termination',
    subtitle_vermieter: 'Official notice form (CO Art. 266l/266o)',
    subtitle_mieter: 'Termination letter (CO Art. 266a)',
    s_sender: 'FROM (LANDLORD / MANAGEMENT)',
    s_recipient: 'TO (TENANT)',
    s_sender_m: 'FROM (TENANT)',
    s_recipient_m: 'TO (LANDLORD / MANAGEMENT)',
    s_object: 'PROPERTY',
    address: 'Address',
    unit: 'Apartment / Unit',
    s_notice: 'NOTICE',
    notice_date: 'Notice date',
    termination_date: 'Termination date',
    notice_period: 'Notice period',
    notice_period_val: '3 months (CO Art. 266a)',
    term_dates: 'Customary termination date',
    term_dates_val: '31 March or 30 September',
    reason_label: 'Reason',
    reason_none: '(no specific reason stated)',
    body_vermieter: 'The landlord hereby gives notice to terminate the above-mentioned tenancy agreement on the termination date stated below, observing the statutory notice period of 3 months pursuant to CO Art. 266a.',
    body_mieter: 'I hereby give notice to terminate the above-mentioned tenancy agreement on the termination date stated below, observing the statutory notice period of 3 months pursuant to CO Art. 266a.',
    s_rights: 'LEGAL INFORMATION',
    rights_vermieter: 'The tenant may contest this termination within 30 days of receipt before the competent conciliation authority (CO Art. 273). The tenant may also apply for an extension of the tenancy. Notice terminating a family home must be served on both spouses/registered partners (CO Art. 266m/n).',
    rights_mieter: 'The tenant is entitled to return the property early if a suitable replacement tenant is provided (CO Art. 264). All keys must be returned on the last day of the tenancy. A move-out inspection will be conducted.',
    s_return: 'RETURN OF PROPERTY',
    return_note: 'The property must be returned on the termination date, clean, fully vacated, and with all keys. Damage beyond normal wear and tear is the tenant\'s responsibility (CO Art. 267a). A final utility bill will be issued after handover.',
    ref_rate: 'Reference interest rate at termination',
    s_sigs: 'SIGNATURES',
    place_date: 'Place, date',
    sig_landlord: 'Landlord / Management signature',
    sig_tenant: 'Tenant signature',
    warning_v: 'Notice by the landlord must be given on the official form (CO Art. 266l). This document serves as the official form.',
    warning_m: 'Tenant termination – no official form required.',
  },
  it: {
    title_vermieter: 'Disdetta del contratto di locazione',
    title_mieter: 'Disdetta del contratto di locazione',
    subtitle_vermieter: 'Modulo ufficiale (CO Art. 266l/266o)',
    subtitle_mieter: 'Lettera di disdetta (CO Art. 266a)',
    s_sender: 'MITTENTE (LOCATORE / AMMINISTRAZIONE)',
    s_recipient: 'DESTINATARIO (CONDUTTORE/CONDUTTRICE)',
    s_sender_m: 'MITTENTE (CONDUTTORE/CONDUTTRICE)',
    s_recipient_m: 'DESTINATARIO (LOCATORE / AMMINISTRAZIONE)',
    s_object: 'OGGETTO LOCATO',
    address: 'Indirizzo',
    unit: 'Appartamento / Unità',
    s_notice: 'DISDETTA',
    notice_date: 'Data della disdetta',
    termination_date: 'Scadenza della disdetta',
    notice_period: 'Termine di disdetta',
    notice_period_val: '3 mesi (CO Art. 266a)',
    term_dates: 'Scadenza consuetudinaria',
    term_dates_val: '31 marzo o 30 settembre',
    reason_label: 'Motivazione',
    reason_none: '(nessuna motivazione specifica indicata)',
    body_vermieter: "Con la presente il locatore disdice il contratto di locazione sopra indicato alla scadenza sotto riportata, rispettando il termine di disdetta legale di 3 mesi secondo CO Art. 266a.",
    body_mieter: "Con la presente disdico il contratto di locazione sopra indicato alla scadenza sotto riportata, rispettando il termine di disdetta legale di 3 mesi secondo CO Art. 266a.",
    s_rights: 'INFORMAZIONI E VIE DI RICORSO',
    rights_vermieter: "Il conduttore può contestare la disdetta entro 30 giorni dal ricevimento presso l'autorità di conciliazione competente (CO Art. 273). Può inoltre richiedere una proroga della locazione. La disdetta di un'abitazione familiare deve essere notificata a entrambi i coniugi/partner registrati (CO Art. 266m/n).",
    rights_mieter: "Il conduttore ha il diritto di restituire l'oggetto locato anticipatamente presentando un subentratario solvibile (CO Art. 264). Le chiavi devono essere restituite integralmente l'ultimo giorno della locazione. Verrà effettuato un verbale di uscita.",
    s_return: 'RESTITUZIONE DELL\'APPARTAMENTO',
    return_note: "L'appartamento deve essere restituito alla scadenza della disdetta, pulito, completamente sgombro e con tutte le chiavi. I danni superiori alla normale usura sono a carico del conduttore (CO Art. 267a). Un conteggio finale delle spese accessorie sarà emesso dopo la restituzione.",
    ref_rate: 'Tasso ipotecario di riferimento alla disdetta',
    s_sigs: 'FIRME',
    place_date: 'Luogo, data',
    sig_landlord: 'Firma locatore / amministrazione',
    sig_tenant: 'Firma conduttore/conduttrice',
    warning_v: 'La disdetta da parte del locatore deve avvenire tramite modulo ufficiale (CO Art. 266l). Il presente documento vale come modulo ufficiale.',
    warning_m: 'Disdetta da parte del conduttore – nessun modulo ufficiale richiesto.',
  },
}

export function KuendigungPdf(data: KuendigungData) {
  const loc = data.locale in i18n ? data.locale : 'de'
  const l = i18n[loc]
  const isVermieter = data.direction === 'vermieter'
  const title = isVermieter ? l.title_vermieter : l.title_mieter
  const subtitle = isVermieter ? l.subtitle_vermieter : l.subtitle_mieter

  const senderSection = isVermieter ? l.s_sender : l.s_sender_m
  const recipientSection = isVermieter ? l.s_recipient : l.s_recipient_m
  const senderName = isVermieter ? data.landlordName : data.tenantName
  const senderAddress = isVermieter ? data.landlordAddress : data.tenantAddress
  const recipientName = isVermieter ? data.tenantName : data.landlordName
  const recipientAddress = isVermieter ? data.tenantAddress : data.landlordAddress

  return (
    <PdfLayout companyName={data.companyName} title={title} subtitleText={subtitle}>

      {/* Warning Box */}
      <View style={pdfStyles.warningBox}>
        <Text style={pdfStyles.warningText}>{isVermieter ? l.warning_v : l.warning_m}</Text>
      </View>

      {/* ── Absender / Empfänger ── */}
      <SectionTitle label={senderSection} />
      <View style={pdfStyles.col2}>
        <View style={pdfStyles.col}>
          <Text style={pdfStyles.colValueBold}>{senderName}</Text>
          {senderAddress.split('\n').map((line, i) => (
            <Text key={i} style={pdfStyles.colValue}>{line}</Text>
          ))}
        </View>
      </View>

      <SectionTitle label={recipientSection} />
      <View style={pdfStyles.col2}>
        <View style={pdfStyles.col}>
          <Text style={pdfStyles.colValueBold}>{recipientName}</Text>
          {recipientAddress.split('\n').map((line, i) => (
            <Text key={i} style={pdfStyles.colValue}>{line}</Text>
          ))}
        </View>
      </View>

      {/* ── Objekt ── */}
      <SectionTitle label={l.s_object} />
      <FieldRow label={l.address} value={data.propertyAddress} />
      <FieldRow label={l.unit} value={data.unitNumber} />

      {/* ── Kündigung ── */}
      <SectionTitle label={l.s_notice} />
      <Text style={[pdfStyles.paragraph, { marginBottom: 8 }]}>
        {isVermieter ? l.body_vermieter : l.body_mieter}
      </Text>
      <FieldRow label={l.notice_date} value={formatDate(data.noticeDate, loc)} />
      <FieldRow label={l.termination_date} value={formatDate(data.terminationDate, loc)} bold />
      <FieldRow label={l.notice_period} value={l.notice_period_val} />
      <FieldRow label={l.term_dates} value={l.term_dates_val} />
      {data.referenzzinssatz != null && isVermieter && (
        <FieldRow label={l.ref_rate} value={`${data.referenzzinssatz.toFixed(2)} %`} />
      )}

      {/* Grund */}
      <SectionTitle label={l.reason_label} />
      <Text style={pdfStyles.paragraph}>
        {data.reason ?? l.reason_none}
      </Text>

      {/* ── Rechtsbelehrung ── */}
      <SectionTitle label={l.s_rights} />
      <View style={pdfStyles.infoBox}>
        <Text style={pdfStyles.infoText}>{isVermieter ? l.rights_vermieter : l.rights_mieter}</Text>
      </View>

      {/* ── Rückgabe ── */}
      <SectionTitle label={l.s_return} />
      <Text style={pdfStyles.note}>{l.return_note}</Text>

      {/* ── Unterschriften ── */}
      <SectionTitle label={l.s_sigs} />
      <View style={pdfStyles.signatureRow}>
        <View style={pdfStyles.signatureBlock}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>{l.place_date}</Text>
        </View>
        <View style={pdfStyles.signatureBlockRight}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>{isVermieter ? l.sig_landlord : l.sig_tenant}</Text>
          <Text style={[pdfStyles.signatureLabel, { marginTop: 2 }]}>{senderName}</Text>
        </View>
      </View>

    </PdfLayout>
  )
}
