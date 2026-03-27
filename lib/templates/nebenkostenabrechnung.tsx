import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, SectionTitle, FieldRow, formatCHF, formatDate, pdfStyles } from './shared'

export interface NebenkostenPosition {
  label: string
  totalCost: number
  /** Tenant's share in % (e.g. 25 for 25%) */
  sharePercent: number
  /** Tenant's amount = totalCost * sharePercent / 100 */
  tenantAmount: number
}

export interface NebenkostenabrechnungData {
  locale: string
  companyName: string
  landlordName: string
  tenantName: string
  tenantAddress: string
  propertyAddress: string
  unitNumber: string
  periodStart: string
  periodEnd: string
  positions: NebenkostenPosition[]
  /** Total advance payments made by tenant during period */
  totalAkontozahlungen: number
}

type L = Record<string, string>

const i18n: Record<string, L> = {
  de: {
    title: 'Nebenkostenabrechnung',
    subtitle: 'gemäss OR Art. 257a/257b – Jährliche Abrechnung',
    s_parties: 'VERTRAGSPARTEIEN',
    landlord: 'Vermieter / Verwaltung',
    tenant: 'Mieter/in',
    s_object: 'MIETOBJEKT',
    address: 'Adresse',
    unit: 'Wohnung / Einheit',
    s_period: 'ABRECHNUNGSPERIODE',
    period: 'Abrechnungsperiode',
    s_costs: 'NEBENKOSTENAUFSTELLUNG',
    col_pos: 'Kostenart',
    col_total: 'Gesamtkosten',
    col_share: 'Anteil',
    col_tenant: 'Mieteranteil',
    total_costs: 'Total Nebenkosten',
    akonto: 'Geleistete Akontozahlungen',
    balance: 'Saldo',
    balance_nachzahlung: 'Nachzahlung durch Mieter',
    balance_rueckerstattung: 'Rückerstattung an Mieter',
    s_info: 'ERLÄUTERUNGEN',
    info_text: 'Die Nebenkosten umfassen sämtliche Aufwendungen gemäss OR Art. 257a für Heizung, Warmwasser, Allgemeinstrom, Hauswart, Kehrichtabfuhr sowie weitere im Mietvertrag vereinbarte Positionen. Der Mieteranteil wird nach dem im Mietvertrag festgelegten Verteilschlüssel berechnet. Differenzen zwischen Akontozahlungen und tatsächlichen Kosten sind innert 30 Tagen nach Zustellung dieser Abrechnung auszugleichen (bei Nachzahlung) bzw. werden innert 30 Tagen erstattet (bei Rückerstattung).',
    s_akonto_adj: 'ANPASSUNG DER AKONTOZAHLUNG',
    akonto_adj_note: 'Aufgrund der vorliegenden Abrechnung wird der monatliche Nebenkostenakonto per nächster Mietzinszahlung wie folgt angepasst:',
    new_akonto: 'Neuer monatlicher Nebenkostenakonto',
    s_sigs: 'UNTERSCHRIFTEN',
    place_date: 'Ort, Datum',
    sig_landlord: 'Unterschrift Vermieter / Verwaltung',
    sig_note: 'Allfällige Einwendungen gegen diese Abrechnung sind innert 30 Tagen schriftlich bei der Vermieterschaft einzureichen.',
    per_month: '/Mt.',
    warning_nachzahlung: 'Nachzahlung fällig innert 30 Tagen nach Zustellung dieser Abrechnung.',
    info_rueckerstattung: 'Rückerstattung erfolgt innert 30 Tagen auf das bekannte Bankkonto.',
  },
  fr: {
    title: 'Décompte des charges accessoires',
    subtitle: 'selon CO Art. 257a/257b – Décompte annuel',
    s_parties: 'PARTIES',
    landlord: 'Bailleur / Gérance',
    tenant: 'Locataire',
    s_object: "OBJET LOUÉ",
    address: 'Adresse',
    unit: 'Appartement / Unité',
    s_period: 'PÉRIODE DE DÉCOMPTE',
    period: 'Période',
    s_costs: 'DÉTAIL DES CHARGES',
    col_pos: 'Nature des charges',
    col_total: 'Coût total',
    col_share: 'Quote-part',
    col_tenant: 'Part locataire',
    total_costs: 'Total charges',
    akonto: 'Acomptes versés',
    balance: 'Solde',
    balance_nachzahlung: 'Supplément à payer par le locataire',
    balance_rueckerstattung: 'Remboursement au locataire',
    s_info: 'EXPLICATIONS',
    info_text: "Les charges accessoires comprennent tous les frais selon CO Art. 257a pour le chauffage, l'eau chaude, l'électricité des parties communes, le concierge, l'enlèvement des ordures et les autres positions convenues au bail. La quote-part du locataire est calculée selon la clé de répartition fixée au bail. Les différences entre acomptes et coûts réels doivent être réglées dans les 30 jours suivant la réception du présent décompte.",
    s_akonto_adj: 'AJUSTEMENT DE L\'ACOMPTE',
    akonto_adj_note: "Sur la base du présent décompte, l'acompte mensuel pour charges est ajusté comme suit dès le prochain paiement de loyer:",
    new_akonto: 'Nouvel acompte mensuel',
    s_sigs: 'SIGNATURES',
    place_date: 'Lieu, date',
    sig_landlord: 'Signature bailleur / gérance',
    sig_note: "Toute objection à ce décompte doit être adressée par écrit au bailleur dans les 30 jours.",
    per_month: '/mois',
    warning_nachzahlung: 'Supplément exigible dans les 30 jours suivant réception du présent décompte.',
    info_rueckerstattung: 'Le remboursement sera effectué dans les 30 jours sur le compte bancaire connu.',
  },
  en: {
    title: 'Service Charge Statement',
    subtitle: 'pursuant to CO Art. 257a/257b – Annual Statement',
    s_parties: 'PARTIES',
    landlord: 'Landlord / Management',
    tenant: 'Tenant',
    s_object: 'PROPERTY',
    address: 'Address',
    unit: 'Apartment / Unit',
    s_period: 'BILLING PERIOD',
    period: 'Period',
    s_costs: 'COST BREAKDOWN',
    col_pos: 'Cost item',
    col_total: 'Total cost',
    col_share: 'Share',
    col_tenant: "Tenant's share",
    total_costs: 'Total service charges',
    akonto: 'Advance payments made',
    balance: 'Balance',
    balance_nachzahlung: 'Additional payment due from tenant',
    balance_rueckerstattung: 'Refund to tenant',
    s_info: 'NOTES',
    info_text: 'Service charges include all costs pursuant to CO Art. 257a for heating, hot water, common area electricity, caretaker, refuse collection, and other items agreed in the tenancy agreement. The tenant\'s share is calculated according to the allocation key in the tenancy agreement. Differences between advance payments and actual costs are due within 30 days of receiving this statement (if additional payment) or will be refunded within 30 days (if refund).',
    s_akonto_adj: 'ADVANCE PAYMENT ADJUSTMENT',
    akonto_adj_note: 'Based on this statement, the monthly advance payment for service charges is adjusted as follows with effect from the next rent payment:',
    new_akonto: 'New monthly advance payment',
    s_sigs: 'SIGNATURES',
    place_date: 'Place, date',
    sig_landlord: 'Landlord / Management signature',
    sig_note: 'Any objections to this statement must be submitted in writing to the landlord within 30 days.',
    per_month: '/mo.',
    warning_nachzahlung: 'Additional payment due within 30 days of receiving this statement.',
    info_rueckerstattung: 'Refund will be made within 30 days to the bank account on file.',
  },
  it: {
    title: 'Conteggio delle spese accessorie',
    subtitle: 'secondo CO Art. 257a/257b – Conteggio annuale',
    s_parties: 'PARTI',
    landlord: 'Locatore / Amministrazione',
    tenant: 'Conduttore/Conduttrice',
    s_object: 'OGGETTO LOCATO',
    address: 'Indirizzo',
    unit: 'Appartamento / Unità',
    s_period: 'PERIODO DI CONTEGGIO',
    period: 'Periodo',
    s_costs: 'DETTAGLIO DELLE SPESE',
    col_pos: 'Tipo di spesa',
    col_total: 'Costo totale',
    col_share: 'Quota',
    col_tenant: 'Quota conduttore',
    total_costs: 'Totale spese accessorie',
    akonto: 'Acconti versati',
    balance: 'Saldo',
    balance_nachzahlung: 'Conguaglio a carico del conduttore',
    balance_rueckerstattung: 'Rimborso al conduttore',
    s_info: 'SPIEGAZIONI',
    info_text: "Le spese accessorie comprendono tutti gli oneri secondo CO Art. 257a per il riscaldamento, l'acqua calda, l'elettricità delle parti comuni, il custode, la raccolta rifiuti e le altre voci concordate nel contratto di locazione. La quota del conduttore è calcolata secondo la chiave di ripartizione stabilita nel contratto. Le differenze tra acconti e costi effettivi devono essere saldate entro 30 giorni dal ricevimento del presente conteggio.",
    s_akonto_adj: 'ADEGUAMENTO DELL\'ACCONTO',
    akonto_adj_note: "In base al presente conteggio, l'acconto mensile per le spese accessorie viene adeguato come segue dal prossimo pagamento della pigione:",
    new_akonto: 'Nuovo acconto mensile',
    s_sigs: 'FIRME',
    place_date: 'Luogo, data',
    sig_landlord: 'Firma locatore / amministrazione',
    sig_note: 'Eventuali contestazioni al presente conteggio devono essere presentate per scritto al locatore entro 30 giorni.',
    per_month: '/mese',
    warning_nachzahlung: 'Conguaglio dovuto entro 30 giorni dal ricevimento del presente conteggio.',
    info_rueckerstattung: 'Il rimborso verrà effettuato entro 30 giorni sul conto bancario noto.',
  },
}

export function NebenkostenabrechnungPdf(data: NebenkostenabrechnungData) {
  const loc = data.locale in i18n ? data.locale : 'de'
  const l = i18n[loc]

  const totalTenantCosts = data.positions.reduce((sum, p) => sum + p.tenantAmount, 0)
  const balance = data.totalAkontozahlungen - totalTenantCosts
  const isNachzahlung = balance < 0
  const newAkonto = totalTenantCosts / 12

  return (
    <PdfLayout companyName={data.companyName} title={l.title} subtitleText={l.subtitle}>

      {/* ── Parteien ── */}
      <SectionTitle label={l.s_parties} />
      <View style={pdfStyles.col2}>
        <View style={pdfStyles.col}>
          <Text style={pdfStyles.colLabel}>{l.landlord}</Text>
          <Text style={pdfStyles.colValueBold}>{data.landlordName}</Text>
        </View>
        <View style={pdfStyles.colRight}>
          <Text style={pdfStyles.colLabel}>{l.tenant}</Text>
          <Text style={pdfStyles.colValueBold}>{data.tenantName}</Text>
          <Text style={pdfStyles.colValue}>{data.tenantAddress}</Text>
        </View>
      </View>

      {/* ── Objekt ── */}
      <SectionTitle label={l.s_object} />
      <FieldRow label={l.address} value={data.propertyAddress} />
      <FieldRow label={l.unit} value={data.unitNumber} />

      {/* ── Periode ── */}
      <SectionTitle label={l.s_period} />
      <FieldRow
        label={l.period}
        value={`${formatDate(data.periodStart, loc)} – ${formatDate(data.periodEnd, loc)}`}
        bold
      />

      {/* ── Kostenaufstellung ── */}
      <SectionTitle label={l.s_costs} />
      <View style={pdfStyles.tableHeader}>
        <Text style={[pdfStyles.tableHeaderCell, { flex: 2.5 }]}>{l.col_pos}</Text>
        <Text style={[pdfStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>{l.col_total}</Text>
        <Text style={[pdfStyles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>{l.col_share}</Text>
        <Text style={[pdfStyles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>{l.col_tenant}</Text>
      </View>
      {data.positions.map((pos, i) => (
        <View key={i} style={i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>{pos.label}</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCHF(pos.totalCost)}</Text>
          <Text style={[pdfStyles.tableCell, { flex: 0.8, textAlign: 'right' }]}>{pos.sharePercent.toFixed(1)} %</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, textAlign: 'right' }]}>{formatCHF(pos.tenantAmount)}</Text>
        </View>
      ))}

      {/* Footer: Totals */}
      <View style={pdfStyles.tableFooter}>
        <Text style={[pdfStyles.tableCellBold, { flex: 2.5 }]}>{l.total_costs}</Text>
        <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'right' }]}></Text>
        <Text style={[pdfStyles.tableCell, { flex: 0.8, textAlign: 'right' }]}></Text>
        <Text style={[pdfStyles.tableCellBold, { flex: 1.2, textAlign: 'right' }]}>{formatCHF(totalTenantCosts)}</Text>
      </View>

      {/* Saldo */}
      <View style={{ marginTop: 8 }}>
        <FieldRow label={l.akonto} value={formatCHF(data.totalAkontozahlungen)} />
        <FieldRow label={l.total_costs} value={`– ${formatCHF(totalTenantCosts)}`} />
        <View style={pdfStyles.divider} />
        <FieldRow
          label={isNachzahlung ? l.balance_nachzahlung : l.balance_rueckerstattung}
          value={formatCHF(Math.abs(balance))}
          bold
        />
      </View>

      {/* Warning / Info */}
      {isNachzahlung ? (
        <View style={[pdfStyles.warningBox, { marginTop: 8 }]}>
          <Text style={pdfStyles.warningText}>{l.warning_nachzahlung}</Text>
        </View>
      ) : (
        <View style={[pdfStyles.infoBox, { marginTop: 8 }]}>
          <Text style={pdfStyles.infoText}>{l.info_rueckerstattung}</Text>
        </View>
      )}

      {/* ── Erläuterungen ── */}
      <SectionTitle label={l.s_info} />
      <Text style={pdfStyles.note}>{l.info_text}</Text>

      {/* ── Akonto-Anpassung ── */}
      <SectionTitle label={l.s_akonto_adj} />
      <Text style={[pdfStyles.note, { marginBottom: 4 }]}>{l.akonto_adj_note}</Text>
      <FieldRow label={l.new_akonto} value={`${formatCHF(newAkonto)} ${l.per_month}`} bold />

      {/* ── Unterschrift ── */}
      <SectionTitle label={l.s_sigs} />
      <Text style={[pdfStyles.note, { marginBottom: 8 }]}>{l.sig_note}</Text>
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

    </PdfLayout>
  )
}
