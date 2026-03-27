import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, SectionTitle, FieldRow, formatCHF, formatDate, pdfStyles } from './shared'

export interface MietvertragData {
  locale: string
  companyName: string
  landlordName: string
  landlordAddress: string
  tenantName: string
  tenantAddress: string
  propertyAddress: string
  unitNumber: string
  floor?: number | null
  rooms?: number | null
  size?: number | null
  startDate: string
  endDate?: string | null
  coldRent: number
  extraCosts: number
  depositAmount?: number | null
  depositBank?: string | null
  referenzzinssatz?: number | null
  indexierung?: boolean
}

type L = Record<string, string>

const i18n: Record<string, L> = {
  de: {
    title: 'Mietvertrag',
    subtitle: 'gemäss Obligationenrecht (OR) Art. 253–274g',
    s_parties: 'VERTRAGSPARTEIEN',
    landlord: 'Vermieter / Verwaltung',
    tenant: 'Mieter/in',
    s_object: 'MIETOBJEKT',
    address: 'Adresse',
    unit: 'Wohnung / Einheit',
    floor: 'Etage',
    rooms: 'Zimmeranzahl',
    area: 'Wohnfläche',
    s_duration: 'VERTRAGSDAUER',
    start: 'Mietbeginn',
    end: 'Mietende (befristet)',
    indefinite: 'Der Mietvertrag ist auf unbestimmte Zeit abgeschlossen.',
    notice_period: 'Kündigungsfrist',
    notice_val: '3 Monate auf den ortsüblichen Termin (OR Art. 266a)',
    term_dates: 'Ortsübliche Termine',
    term_val: '31. März / 30. September',
    s_rent: 'MIETZINS',
    net_rent: 'Nettomietzins',
    extra_costs: 'Nebenkosten (Akonto)',
    gross_rent: 'Bruttomietzins (Total)',
    due: 'Zahlbar',
    due_val: 'Monatlich im Voraus, bis zum 1. des Monats',
    billing: 'NK-Abrechnung',
    billing_val: 'Jährlich per 31. Dezember, Akontozahlung wird angepasst',
    s_deposit: 'MIETKAUTION',
    deposit_amt: 'Kautionsbetrag',
    deposit_note: 'max. 3 Monatsnettomieten (OR Art. 257e)',
    deposit_bank: 'Hinterlegt bei',
    deposit_when: 'Hinterlegung',
    deposit_when_val: 'Vor Mietantritt (Bedingung für Schlüsselübergabe)',
    s_rent_adj: 'MIETZINSANPASSUNG',
    ref_rate: 'Referenzzinssatz (SECO) bei Mietantritt',
    ref_rate_note: 'Mietzinsanpassungen erfolgen nach Massgabe des Referenzzinssatzes (OR Art. 269a)',
    index_no: 'Keine Indexklausel vereinbart',
    index_yes: 'Indexklausel (LIK) gemäss separater Vereinbarung',
    s_ancillary: 'NEBENKOSTEN (OR ART. 257A)',
    ancillary_note: 'Als Nebenkosten werden insbesondere verrechnet: Heizung, Warmwasser, Allgemeinstrom, Hauswart (anteilig), Kehrichtabfuhr, Lift. Die Abrechnung erfolgt jährlich und wird dem Mieter zugestellt.',
    s_houserules: 'HAUSORDNUNG',
    hr_note: 'Die Hausordnung ist integrierender Bestandteil dieses Mietvertrags. Ruhezeiten: Werktags 22:00–07:00 Uhr sowie Sonn- und Feiertage ganztags. Haustiere: nur mit vorgängiger schriftlicher Zustimmung des Vermieters.',
    s_subletting: 'UNTERVERMIETUNG',
    sub_note: 'Eine Untervermietung der Mietsache oder von Teilen davon bedarf der vorgängigen schriftlichen Zustimmung des Vermieters (OR Art. 262). Eine Verweigerung ist nur aus wichtigen Gründen zulässig.',
    s_renovation: 'ABNUTZUNG UND RENOVATIONSPFLICHT',
    ren_note: 'Normale Abnutzung geht zu Lasten des Vermieters. Der Mieter haftet für übermässige Abnutzung und Schäden (OR Art. 267a). Bei Auszug sind Schönheitsreparaturen im üblichen Umfang vorzunehmen (Wände, Decken gemäss Farbenkarte).',
    s_disputes: 'RECHTSANWENDUNG UND STREITIGKEITEN',
    disp_note: 'Es gilt schweizerisches Recht. Streitigkeiten werden der zuständigen Schlichtungsbehörde für Mietsachen unterbreitet (OR Art. 274). Gerichtsstand ist der Ort der gelegenen Sache.',
    copies: 'Dieser Vertrag wird in zwei gleichlautenden Ausfertigungen erstellt; je eine Ausfertigung für Vermieter und Mieter.',
    s_sigs: 'UNTERSCHRIFTEN',
    place_date: 'Ort, Datum',
    sig_landlord: 'Unterschrift Vermieter / Verwaltung',
    sig_tenant: 'Unterschrift Mieter/in',
    chf_mo: '/Mt.',
    sqm: 'm²',
    rooms_unit: 'Zi.',
  },
  fr: {
    title: 'Contrat de bail',
    subtitle: "conformément au Code des obligations (CO) Art. 253–274g",
    s_parties: 'PARTIES AU CONTRAT',
    landlord: 'Bailleur / Gérance',
    tenant: 'Locataire',
    s_object: "OBJET LOUÉ",
    address: 'Adresse',
    unit: 'Appartement / Unité',
    floor: 'Étage',
    rooms: 'Nombre de pièces',
    area: 'Surface habitable',
    s_duration: 'DURÉE DU BAIL',
    start: 'Début du bail',
    end: 'Fin du bail (durée déterminée)',
    indefinite: 'Le bail est conclu pour une durée indéterminée.',
    notice_period: 'Délai de résiliation',
    notice_val: "3 mois à l'échéance réglementaire (CO Art. 266a)",
    term_dates: 'Échéances réglementaires',
    term_val: '31 mars / 30 septembre',
    s_rent: 'LOYER',
    net_rent: 'Loyer net',
    extra_costs: 'Charges accessoires (acompte)',
    gross_rent: 'Loyer brut (total)',
    due: 'Payable',
    due_val: "Mensuellement d'avance, le 1er du mois",
    billing: 'Décompte des charges',
    billing_val: 'Annuellement au 31 décembre, acompte ajustable',
    s_deposit: 'GARANTIE DE LOYER',
    deposit_amt: 'Montant de la garantie',
    deposit_note: 'max. 3 loyers nets (CO Art. 257e)',
    deposit_bank: 'Déposé auprès de',
    deposit_when: 'Dépôt',
    deposit_when_val: "Avant l'entrée dans les lieux",
    s_rent_adj: 'ADAPTATION DU LOYER',
    ref_rate: 'Taux hypothécaire de référence (OFBL) à la conclusion',
    ref_rate_note: "Les adaptations de loyer s'effectuent selon le taux de référence (CO Art. 269a)",
    index_no: "Aucune clause d'indexation convenue",
    index_yes: "Clause d'indexation (IPC) selon accord séparé",
    s_ancillary: 'CHARGES ACCESSOIRES (CO ART. 257A)',
    ancillary_note: 'Sont notamment facturées comme charges: chauffage, eau chaude, électricité des parties communes, concierge (part.), enlèvement des ordures, ascenseur. Le décompte annuel est adressé au locataire.',
    s_houserules: 'RÈGLEMENT DE MAISON',
    hr_note: "Le règlement de maison fait partie intégrante du présent bail. Heures de silence: jours ouvrables 22h00–07h00, dimanches et jours fériés toute la journée. Animaux: uniquement avec accord écrit préalable du bailleur.",
    s_subletting: 'SOUS-LOCATION',
    sub_note: "Toute sous-location nécessite l'accord écrit préalable du bailleur (CO Art. 262). Le refus n'est admissible que pour des motifs importants.",
    s_renovation: 'USURE ET OBLIGATIONS DE RÉNOVATION',
    ren_note: "L'usure normale est à la charge du bailleur. Le locataire répond des dégradations excessives (CO Art. 267a). À la restitution, les travaux de remise en état courants sont à la charge du locataire.",
    s_disputes: 'DROIT APPLICABLE ET LITIGES',
    disp_note: 'Le droit suisse est applicable. Les litiges sont soumis à l\'autorité de conciliation compétente en matière de baux (CO Art. 274).',
    copies: 'Le présent contrat est établi en deux exemplaires, un pour chaque partie.',
    s_sigs: 'SIGNATURES',
    place_date: 'Lieu, date',
    sig_landlord: 'Signature bailleur / gérance',
    sig_tenant: 'Signature locataire',
    chf_mo: '/mois',
    sqm: 'm²',
    rooms_unit: 'p.',
  },
  en: {
    title: 'Tenancy Agreement',
    subtitle: "pursuant to Swiss Code of Obligations (CO) Art. 253–274g",
    s_parties: 'PARTIES',
    landlord: 'Landlord / Management',
    tenant: 'Tenant',
    s_object: 'RENTED PROPERTY',
    address: 'Address',
    unit: 'Apartment / Unit',
    floor: 'Floor',
    rooms: 'Number of rooms',
    area: 'Living area',
    s_duration: 'TERM',
    start: 'Commencement',
    end: 'End date (fixed term)',
    indefinite: 'This agreement is concluded for an indefinite term.',
    notice_period: 'Notice period',
    notice_val: '3 months to the customary termination date (CO Art. 266a)',
    term_dates: 'Customary termination dates',
    term_val: '31 March / 30 September',
    s_rent: 'RENT',
    net_rent: 'Net rent',
    extra_costs: 'Ancillary costs (advance)',
    gross_rent: 'Gross rent (total)',
    due: 'Payable',
    due_val: 'Monthly in advance, by the 1st of the month',
    billing: 'Service charge accounting',
    billing_val: 'Annual accounting as at 31 December',
    s_deposit: 'SECURITY DEPOSIT',
    deposit_amt: 'Deposit amount',
    deposit_note: 'max. 3 months\' net rent (CO Art. 257e)',
    deposit_bank: 'Deposited with',
    deposit_when: 'Due',
    deposit_when_val: 'Before commencement of tenancy',
    s_rent_adj: 'RENT ADJUSTMENT',
    ref_rate: 'Reference interest rate (FOPH) at commencement',
    ref_rate_note: 'Rent adjustments are made in accordance with the reference rate (CO Art. 269a)',
    index_no: 'No indexation clause agreed',
    index_yes: 'Indexation clause (CPI) per separate agreement',
    s_ancillary: 'ANCILLARY COSTS (CO ART. 257A)',
    ancillary_note: 'Ancillary costs include in particular: heating, hot water, common area electricity, caretaker (proportional), refuse collection, lift. Annual accounting is provided to the tenant.',
    s_houserules: 'HOUSE RULES',
    hr_note: 'The house rules form an integral part of this agreement. Quiet hours: weekdays 22:00–07:00, Sundays and public holidays all day. Pets: only with prior written consent of the landlord.',
    s_subletting: 'SUBLETTING',
    sub_note: 'Subletting requires the landlord\'s prior written consent (CO Art. 262). Refusal is only permissible for important reasons.',
    s_renovation: 'WEAR & TEAR AND RENOVATION',
    ren_note: 'Normal wear and tear is at the landlord\'s expense. The tenant is liable for excessive wear and damage (CO Art. 267a). Upon vacating, cosmetic repairs are the tenant\'s responsibility.',
    s_disputes: 'GOVERNING LAW AND DISPUTES',
    disp_note: 'Swiss law applies. Disputes shall be submitted to the competent conciliation authority for tenancy matters (CO Art. 274).',
    copies: 'This agreement is drawn up in two identical copies, one for each party.',
    s_sigs: 'SIGNATURES',
    place_date: 'Place, date',
    sig_landlord: 'Landlord / Management signature',
    sig_tenant: 'Tenant signature',
    chf_mo: '/mo.',
    sqm: 'm²',
    rooms_unit: 'rm.',
  },
  it: {
    title: 'Contratto di locazione',
    subtitle: "ai sensi del Codice delle obbligazioni (CO) Art. 253–274g",
    s_parties: 'PARTI DEL CONTRATTO',
    landlord: 'Locatore / Amministrazione',
    tenant: 'Conduttore/Conduttrice',
    s_object: 'OGGETTO LOCATO',
    address: 'Indirizzo',
    unit: 'Appartamento / Unità',
    floor: 'Piano',
    rooms: 'Numero di locali',
    area: 'Superficie abitabile',
    s_duration: 'DURATA DEL CONTRATTO',
    start: 'Inizio della locazione',
    end: 'Fine della locazione (a termine)',
    indefinite: 'Il contratto è stipulato a tempo indeterminato.',
    notice_period: 'Termine di disdetta',
    notice_val: '3 mesi alla scadenza consuetudinaria (CO Art. 266a)',
    term_dates: 'Scadenze consuetudinarie',
    term_val: '31 marzo / 30 settembre',
    s_rent: 'PIGIONE',
    net_rent: 'Pigione netta',
    extra_costs: 'Spese accessorie (acconto)',
    gross_rent: 'Pigione lorda (totale)',
    due: 'Pagabile',
    due_val: 'Mensilmente anticipatamente, entro il 1° del mese',
    billing: 'Conteggio delle spese',
    billing_val: 'Annualmente al 31 dicembre, acconto adattabile',
    s_deposit: 'GARANZIA DI LOCAZIONE',
    deposit_amt: "Importo della garanzia",
    deposit_note: 'max. 3 pigioni mensili nette (CO Art. 257e)',
    deposit_bank: 'Depositato presso',
    deposit_when: 'Deposito',
    deposit_when_val: "Prima dell'inizio della locazione",
    s_rent_adj: 'ADEGUAMENTO DELLA PIGIONE',
    ref_rate: "Tasso ipotecario di riferimento (UFAb) all'inizio",
    ref_rate_note: "Gli adeguamenti avvengono secondo il tasso di riferimento (CO Art. 269a)",
    index_no: "Nessuna clausola d'indicizzazione pattuita",
    index_yes: "Clausola d'indicizzazione (IPC) secondo accordo separato",
    s_ancillary: 'SPESE ACCESSORIE (CO ART. 257A)',
    ancillary_note: 'Come spese accessorie vengono fatturate in particolare: riscaldamento, acqua calda, elettricità parti comuni, custode (quota), raccolta rifiuti, ascensore. Il conteggio annuale viene inviato al conduttore.',
    s_houserules: 'REGOLAMENTO DI CASA',
    hr_note: 'Il regolamento di casa è parte integrante del presente contratto. Ore di silenzio: giorni feriali 22:00–07:00, domeniche e giorni festivi tutto il giorno. Animali: solo con previo consenso scritto del locatore.',
    s_subletting: 'SUBLOCAZIONE',
    sub_note: 'La sublocazione richiede il previo consenso scritto del locatore (CO Art. 262). Il rifiuto è ammissibile solo per motivi importanti.',
    s_renovation: 'USURA E OBBLIGO DI RINNOVO',
    ren_note: "L'usura normale è a carico del locatore. Il conduttore risponde delle deteriorazioni eccessive (CO Art. 267a). Al momento del rilascio, i lavori di rinnovo usuali sono a carico del conduttore.",
    s_disputes: 'DIRITTO APPLICABILE E CONTROVERSIE',
    disp_note: 'Si applica il diritto svizzero. Le controversie sono sottoposte all\'autorità di conciliazione competente in materia di locazione (CO Art. 274).',
    copies: 'Il presente contratto è redatto in due copie identiche, una per ciascuna parte.',
    s_sigs: 'FIRME',
    place_date: 'Luogo, data',
    sig_landlord: 'Firma locatore / amministrazione',
    sig_tenant: 'Firma conduttore/conduttrice',
    chf_mo: '/mese',
    sqm: 'm²',
    rooms_unit: 'loc.',
  },
}

export function MietvertragPdf(data: MietvertragData) {
  const loc = data.locale in i18n ? data.locale : 'de'
  const l = i18n[loc]
  const gross = data.coldRent + data.extraCosts

  return (
    <PdfLayout companyName={data.companyName} title={l.title} subtitleText={l.subtitle}>

      {/* ── Parteien ── */}
      <SectionTitle label={l.s_parties} />
      <View style={pdfStyles.col2}>
        <View style={pdfStyles.col}>
          <Text style={pdfStyles.colLabel}>{l.landlord}</Text>
          <Text style={pdfStyles.colValueBold}>{data.landlordName}</Text>
          {data.landlordAddress.split('\n').map((line, i) => (
            <Text key={i} style={pdfStyles.colValue}>{line}</Text>
          ))}
        </View>
        <View style={pdfStyles.colRight}>
          <Text style={pdfStyles.colLabel}>{l.tenant}</Text>
          <Text style={pdfStyles.colValueBold}>{data.tenantName}</Text>
          {data.tenantAddress.split('\n').map((line, i) => (
            <Text key={i} style={pdfStyles.colValue}>{line}</Text>
          ))}
        </View>
      </View>

      {/* ── Mietobjekt ── */}
      <SectionTitle label={l.s_object} />
      <FieldRow label={l.address} value={data.propertyAddress} />
      <FieldRow label={l.unit} value={data.unitNumber} />
      {data.floor != null && <FieldRow label={l.floor} value={String(data.floor)} />}
      {data.rooms != null && <FieldRow label={l.rooms} value={`${data.rooms} ${l.rooms_unit}`} />}
      {data.size != null && <FieldRow label={l.area} value={`${data.size} ${l.sqm}`} />}

      {/* ── Vertragsdauer ── */}
      <SectionTitle label={l.s_duration} />
      <FieldRow label={l.start} value={formatDate(data.startDate, loc)} bold />
      {data.endDate
        ? <FieldRow label={l.end} value={formatDate(data.endDate, loc)} bold />
        : <Text style={pdfStyles.note}>{l.indefinite}</Text>
      }
      <FieldRow label={l.notice_period} value={l.notice_val} />
      <FieldRow label={l.term_dates} value={l.term_val} />

      {/* ── Mietzins ── */}
      <SectionTitle label={l.s_rent} />
      <FieldRow label={l.net_rent} value={`${formatCHF(data.coldRent)} ${l.chf_mo}`} bold />
      <FieldRow label={l.extra_costs} value={`${formatCHF(data.extraCosts)} ${l.chf_mo}`} />
      <View style={pdfStyles.divider} />
      <FieldRow label={l.gross_rent} value={`${formatCHF(gross)} ${l.chf_mo}`} bold />
      <FieldRow label={l.due} value={l.due_val} />
      <FieldRow label={l.billing} value={l.billing_val} />

      {/* ── Kaution ── */}
      <SectionTitle label={l.s_deposit} />
      {data.depositAmount != null
        ? <FieldRow label={l.deposit_amt} value={formatCHF(data.depositAmount)} bold />
        : <FieldRow label={l.deposit_amt} value={`${formatCHF(data.coldRent * 3)} (${l.deposit_note})`} />
      }
      <Text style={pdfStyles.note}>{l.deposit_note}</Text>
      {data.depositBank && <FieldRow label={l.deposit_bank} value={data.depositBank} />}
      <FieldRow label={l.deposit_when} value={l.deposit_when_val} />

      {/* ── Mietzinsanpassung ── */}
      <SectionTitle label={l.s_rent_adj} />
      <FieldRow
        label={l.ref_rate}
        value={data.referenzzinssatz != null ? `${data.referenzzinssatz.toFixed(2)} %` : '______ %'}
      />
      <Text style={pdfStyles.note}>{l.ref_rate_note}</Text>
      <FieldRow label={loc === 'de' ? 'Indexklausel' : loc === 'fr' ? "Indexation" : loc === 'it' ? "Indicizzazione" : "Indexation"} value={data.indexierung ? l.index_yes : l.index_no} />

      {/* ── Nebenkosten ── */}
      <SectionTitle label={l.s_ancillary} />
      <Text style={pdfStyles.note}>{l.ancillary_note}</Text>

      {/* ── Hausordnung ── */}
      <SectionTitle label={l.s_houserules} />
      <Text style={pdfStyles.note}>{l.hr_note}</Text>

      {/* ── Untervermietung ── */}
      <SectionTitle label={l.s_subletting} />
      <Text style={pdfStyles.note}>{l.sub_note}</Text>

      {/* ── Renovation ── */}
      <SectionTitle label={l.s_renovation} />
      <Text style={pdfStyles.note}>{l.ren_note}</Text>

      {/* ── Streitigkeiten ── */}
      <SectionTitle label={l.s_disputes} />
      <Text style={pdfStyles.note}>{l.disp_note}</Text>
      <Text style={[pdfStyles.note, { marginTop: 4 }]}>{l.copies}</Text>

      {/* ── Unterschriften ── */}
      <SectionTitle label={l.s_sigs} />
      <View style={pdfStyles.signatureRow}>
        <View style={pdfStyles.signatureBlock}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>{l.place_date}</Text>
        </View>
        <View style={pdfStyles.signatureBlockRight}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>{l.sig_landlord}</Text>
          <Text style={[pdfStyles.signatureLabel, { marginTop: 2 }]}>{data.landlordName}</Text>
        </View>
      </View>
      <View style={pdfStyles.signatureRow}>
        <View style={pdfStyles.signatureBlock}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>{l.place_date}</Text>
        </View>
        <View style={pdfStyles.signatureBlockRight}>
          <View style={pdfStyles.signatureLine} />
          <Text style={pdfStyles.signatureLabel}>{l.sig_tenant}</Text>
          <Text style={[pdfStyles.signatureLabel, { marginTop: 2 }]}>{data.tenantName}</Text>
        </View>
      </View>

    </PdfLayout>
  )
}
