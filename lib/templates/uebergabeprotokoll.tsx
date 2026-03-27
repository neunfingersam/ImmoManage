import { Text, View } from '@react-pdf/renderer'
import { PdfLayout, SectionTitle, FieldRow, formatDate, pdfStyles } from './shared'

export interface UebergabeprotokollData {
  locale: string
  companyName: string
  landlordName: string
  tenantName: string
  tenantAddress: string
  propertyAddress: string
  unitNumber: string
  floor?: number | null
  rooms?: number | null
  handoverDate: string
  /** 'einzug' | 'auszug' */
  handoverType: 'einzug' | 'auszug'
  keyCount?: number | null
  mailboxKeyCount?: number | null
  basementKeyCount?: number | null
  garagekeyCount?: number | null
  electricityMeter?: string | null
  gasMeter?: string | null
  waterMeter?: string | null
  heatMeter?: string | null
  remarks?: string | null
}

type L = Record<string, string>

const i18n: Record<string, L> = {
  de: {
    title: 'Wohnungsübergabeprotokoll',
    type_einzug: 'Einzugsprotokoll',
    type_auszug: 'Auszugsprotokoll',
    subtitle_einzug: 'Protokoll bei Mietbeginn gemäss OR Art. 256',
    subtitle_auszug: 'Protokoll bei Mietende gemäss OR Art. 267',
    s_parties: 'VERTRAGSPARTEIEN',
    landlord: 'Vermieter / Verwaltung',
    tenant: 'Mieter/in',
    s_object: 'MIETOBJEKT',
    address: 'Adresse',
    unit: 'Wohnung / Einheit',
    floor: 'Etage',
    rooms: 'Zimmeranzahl',
    handover_date: 'Übergabedatum',
    handover_type: 'Art der Übergabe',
    s_keys: 'SCHLÜSSELÜBERGABE',
    key_apt: 'Wohnungsschlüssel',
    key_mailbox: 'Briefkastenschlüssel',
    key_basement: 'Kellerschlüssel',
    key_garage: 'Garagenschlüssel',
    keys_unit: 'Stk.',
    s_meters: 'ZÄHLERSTÄNDE',
    meter_elec: 'Stromzähler (kWh)',
    meter_gas: 'Gaszähler (m³)',
    meter_water: 'Wasserzähler (m³)',
    meter_heat: 'Wärmemengenzähler',
    s_rooms: 'ZUSTAND DER RÄUMLICHKEITEN',
    rooms_note: 'Zustand bei Übergabe (Mängel und Bemerkungen sind in der Spalte «Bemerkungen» einzutragen)',
    room_name: 'Raum',
    room_walls: 'Wände/Decke',
    room_floor: 'Boden',
    room_windows: 'Fenster/Türen',
    room_fixtures: 'Installationen',
    room_remarks: 'Bemerkungen',
    cond_ok: 'i.O.',
    cond_damage: 'Mängel',
    room_entrance: 'Eingang / Korridor',
    room_living: 'Wohnzimmer',
    room_kitchen: 'Küche',
    room_bath: 'Bad / WC',
    room_bedroom: 'Schlafzimmer',
    room_bedroom2: 'Schlafzimmer 2',
    room_balcony: 'Balkon / Terrasse',
    room_basement: 'Keller / Estrich',
    s_appliances: 'EINRICHTUNGEN UND GERÄTE',
    appl_note: 'Zustand der mitgemieteten Geräte und Einrichtungen',
    appl_name: 'Gerät / Einrichtung',
    appl_present: 'Vorhanden',
    appl_condition: 'Zustand',
    appl_remarks: 'Bemerkungen',
    appl_stove: 'Herd / Backofen',
    appl_fridge: 'Kühlschrank',
    appl_dishwasher: 'Geschirrspüler',
    appl_washer: 'Waschmaschine / Tumbler',
    appl_blinds: 'Storen / Jalousien',
    appl_boiler: 'Boiler',
    yes: 'Ja',
    no: 'Nein',
    s_remarks: 'BEMERKUNGEN / MÄNGEL',
    remarks_placeholder: '(keine)',
    s_sigs: 'UNTERSCHRIFTEN',
    sig_note: 'Mit ihrer Unterschrift bestätigen die Parteien, das Protokoll zur Kenntnis genommen und die Schlüssel übergeben/empfangen zu haben.',
    place_date: 'Ort, Datum',
    sig_landlord: 'Unterschrift Vermieter / Verwaltung',
    sig_tenant: 'Unterschrift Mieter/in',
    rooms_unit: 'Zi.',
    info_auszug: 'Bei Auszug: Allfällige Schäden über das normale Mass der Abnutzung gehen zu Lasten des Mieters (OR Art. 267a). Das Protokoll ist von beiden Parteien zu unterzeichnen. Eine Kopie geht an den Mieter.',
    info_einzug: 'Bei Einzug: Bereits vorhandene Schäden und Mängel sind festzuhalten. Der Mieter hat das Recht, innert 24 Stunden Mängel nachzumelden.',
  },
  fr: {
    title: "État des lieux",
    type_einzug: "État des lieux d'entrée",
    type_auszug: "État des lieux de sortie",
    subtitle_einzug: "Procès-verbal à l'entrée dans les lieux selon CO Art. 256",
    subtitle_auszug: "Procès-verbal à la restitution selon CO Art. 267",
    s_parties: 'PARTIES',
    landlord: 'Bailleur / Gérance',
    tenant: 'Locataire',
    s_object: "OBJET LOUÉ",
    address: 'Adresse',
    unit: 'Appartement / Unité',
    floor: 'Étage',
    rooms: 'Nombre de pièces',
    handover_date: 'Date de remise',
    handover_type: 'Type de remise',
    s_keys: 'REMISE DES CLÉS',
    key_apt: "Clés d'appartement",
    key_mailbox: 'Clés de boîte aux lettres',
    key_basement: 'Clés de cave',
    key_garage: 'Clés de garage',
    keys_unit: 'pcs',
    s_meters: 'RELEVÉS DE COMPTEURS',
    meter_elec: 'Compteur électrique (kWh)',
    meter_gas: 'Compteur gaz (m³)',
    meter_water: "Compteur d'eau (m³)",
    meter_heat: 'Compteur calorimétrique',
    s_rooms: 'ÉTAT DES LOCAUX',
    rooms_note: "État au moment de la remise (les défauts et remarques sont à inscrire dans la colonne «Remarques»)",
    room_name: 'Local',
    room_walls: 'Murs/plafond',
    room_floor: 'Sol',
    room_windows: 'Fenêtres/portes',
    room_fixtures: 'Installations',
    room_remarks: 'Remarques',
    cond_ok: 'OK',
    cond_damage: 'Défauts',
    room_entrance: 'Entrée / couloir',
    room_living: 'Salon',
    room_kitchen: 'Cuisine',
    room_bath: 'Salle de bain / WC',
    room_bedroom: 'Chambre',
    room_bedroom2: 'Chambre 2',
    room_balcony: 'Balcon / terrasse',
    room_basement: 'Cave / grenier',
    s_appliances: 'ÉQUIPEMENTS ET APPAREILS',
    appl_note: 'État des appareils et équipements loués',
    appl_name: 'Appareil / Équipement',
    appl_present: 'Présent',
    appl_condition: 'État',
    appl_remarks: 'Remarques',
    appl_stove: 'Cuisinière / four',
    appl_fridge: 'Réfrigérateur',
    appl_dishwasher: 'Lave-vaisselle',
    appl_washer: 'Machine à laver / sèche-linge',
    appl_blinds: 'Stores / jalousies',
    appl_boiler: 'Chauffe-eau',
    yes: 'Oui',
    no: 'Non',
    s_remarks: 'REMARQUES / DÉFAUTS',
    remarks_placeholder: '(aucun)',
    s_sigs: 'SIGNATURES',
    sig_note: "Par leur signature, les parties confirment avoir pris connaissance du procès-verbal et avoir remis/reçu les clés.",
    place_date: 'Lieu, date',
    sig_landlord: 'Signature bailleur / gérance',
    sig_tenant: 'Signature locataire',
    rooms_unit: 'p.',
    info_auszug: "À la sortie: les dommages dépassant l'usure normale sont à la charge du locataire (CO Art. 267a). Le procès-verbal doit être signé par les deux parties. Une copie est remise au locataire.",
    info_einzug: "À l'entrée: les dommages et défauts préexistants doivent être consignés. Le locataire a le droit de signaler des défauts supplémentaires dans les 24 heures.",
  },
  en: {
    title: 'Property Handover Report',
    type_einzug: 'Move-In Inspection Report',
    type_auszug: 'Move-Out Inspection Report',
    subtitle_einzug: 'Condition report at commencement of tenancy (CO Art. 256)',
    subtitle_auszug: 'Condition report at end of tenancy (CO Art. 267)',
    s_parties: 'PARTIES',
    landlord: 'Landlord / Management',
    tenant: 'Tenant',
    s_object: 'PROPERTY',
    address: 'Address',
    unit: 'Apartment / Unit',
    floor: 'Floor',
    rooms: 'Number of rooms',
    handover_date: 'Handover date',
    handover_type: 'Type',
    s_keys: 'KEY HANDOVER',
    key_apt: 'Apartment keys',
    key_mailbox: 'Mailbox keys',
    key_basement: 'Basement keys',
    key_garage: 'Garage keys',
    keys_unit: 'pcs',
    s_meters: 'METER READINGS',
    meter_elec: 'Electricity meter (kWh)',
    meter_gas: 'Gas meter (m³)',
    meter_water: 'Water meter (m³)',
    meter_heat: 'Heat meter',
    s_rooms: 'CONDITION OF ROOMS',
    rooms_note: 'Condition at handover (defects and remarks to be entered in the "Remarks" column)',
    room_name: 'Room',
    room_walls: 'Walls/ceiling',
    room_floor: 'Floor',
    room_windows: 'Windows/doors',
    room_fixtures: 'Fixtures',
    room_remarks: 'Remarks',
    cond_ok: 'OK',
    cond_damage: 'Defects',
    room_entrance: 'Entrance / hallway',
    room_living: 'Living room',
    room_kitchen: 'Kitchen',
    room_bath: 'Bathroom / WC',
    room_bedroom: 'Bedroom',
    room_bedroom2: 'Bedroom 2',
    room_balcony: 'Balcony / terrace',
    room_basement: 'Basement / attic',
    s_appliances: 'APPLIANCES & FITTINGS',
    appl_note: 'Condition of included appliances and fittings',
    appl_name: 'Appliance / Fitting',
    appl_present: 'Present',
    appl_condition: 'Condition',
    appl_remarks: 'Remarks',
    appl_stove: 'Stove / oven',
    appl_fridge: 'Refrigerator',
    appl_dishwasher: 'Dishwasher',
    appl_washer: 'Washing machine / dryer',
    appl_blinds: 'Blinds / shutters',
    appl_boiler: 'Boiler',
    yes: 'Yes',
    no: 'No',
    s_remarks: 'REMARKS / DEFECTS',
    remarks_placeholder: '(none)',
    s_sigs: 'SIGNATURES',
    sig_note: 'By signing, both parties confirm that they have reviewed this report and that the keys have been handed over/received.',
    place_date: 'Place, date',
    sig_landlord: 'Landlord / Management signature',
    sig_tenant: 'Tenant signature',
    rooms_unit: 'rm.',
    info_auszug: 'At move-out: damage beyond normal wear and tear is the tenant\'s responsibility (CO Art. 267a). The report must be signed by both parties. A copy is provided to the tenant.',
    info_einzug: 'At move-in: pre-existing defects must be recorded. The tenant has the right to report additional defects within 24 hours.',
  },
  it: {
    title: 'Verbale di consegna appartamento',
    type_einzug: 'Verbale di entrata',
    type_auszug: 'Verbale di uscita',
    subtitle_einzug: "Verbale all'inizio della locazione secondo CO Art. 256",
    subtitle_auszug: "Verbale alla restituzione secondo CO Art. 267",
    s_parties: 'PARTI',
    landlord: 'Locatore / Amministrazione',
    tenant: 'Conduttore/Conduttrice',
    s_object: 'OGGETTO LOCATO',
    address: 'Indirizzo',
    unit: 'Appartamento / Unità',
    floor: 'Piano',
    rooms: 'Numero di locali',
    handover_date: 'Data di consegna',
    handover_type: 'Tipo di consegna',
    s_keys: 'CONSEGNA CHIAVI',
    key_apt: 'Chiavi appartamento',
    key_mailbox: 'Chiavi cassetta postale',
    key_basement: 'Chiavi cantina',
    key_garage: 'Chiavi garage',
    keys_unit: 'pz.',
    s_meters: 'LETTURE CONTATORI',
    meter_elec: 'Contatore elettrico (kWh)',
    meter_gas: 'Contatore gas (m³)',
    meter_water: "Contatore acqua (m³)",
    meter_heat: 'Contatore termico',
    s_rooms: 'STATO DEI LOCALI',
    rooms_note: "Stato alla consegna (difetti e osservazioni da inserire nella colonna «Osservazioni»)",
    room_name: 'Locale',
    room_walls: 'Pareti/soffitto',
    room_floor: 'Pavimento',
    room_windows: 'Finestre/porte',
    room_fixtures: 'Impianti',
    room_remarks: 'Osservazioni',
    cond_ok: 'OK',
    cond_damage: 'Difetti',
    room_entrance: 'Entrata / corridoio',
    room_living: 'Soggiorno',
    room_kitchen: 'Cucina',
    room_bath: 'Bagno / WC',
    room_bedroom: 'Camera da letto',
    room_bedroom2: 'Camera da letto 2',
    room_balcony: 'Balcone / terrazzo',
    room_basement: 'Cantina / soffitta',
    s_appliances: 'ATTREZZATURE E APPARECCHI',
    appl_note: 'Stato degli apparecchi e attrezzature inclusi',
    appl_name: 'Apparecchio / Attrezzatura',
    appl_present: 'Presente',
    appl_condition: 'Stato',
    appl_remarks: 'Osservazioni',
    appl_stove: 'Cucina / forno',
    appl_fridge: 'Frigorifero',
    appl_dishwasher: 'Lavastoviglie',
    appl_washer: 'Lavatrice / asciugatrice',
    appl_blinds: 'Tapparelle / veneziane',
    appl_boiler: 'Scaldacqua',
    yes: 'Sì',
    no: 'No',
    s_remarks: 'OSSERVAZIONI / DIFETTI',
    remarks_placeholder: '(nessuno)',
    s_sigs: 'FIRME',
    sig_note: 'Con la firma le parti confermano di aver preso atto del verbale e di aver consegnato/ricevuto le chiavi.',
    place_date: 'Luogo, data',
    sig_landlord: 'Firma locatore / amministrazione',
    sig_tenant: 'Firma conduttore/conduttrice',
    rooms_unit: 'loc.',
    info_auszug: "All'uscita: i danni superiori alla normale usura sono a carico del conduttore (CO Art. 267a). Il verbale deve essere firmato da entrambe le parti. Una copia è consegnata al conduttore.",
    info_einzug: "All'entrata: i danni e difetti preesistenti devono essere documentati. Il conduttore ha il diritto di segnalare ulteriori difetti entro 24 ore.",
  },
}

function RoomTableHeader({ l }: { l: L }) {
  const cols = [
    { label: l.room_name, flex: 1.4 },
    { label: l.room_walls, flex: 1 },
    { label: l.room_floor, flex: 1 },
    { label: l.room_windows, flex: 1 },
    { label: l.room_fixtures, flex: 1 },
    { label: l.room_remarks, flex: 1.6 },
  ]
  return (
    <View style={pdfStyles.tableHeader}>
      {cols.map(({ label, flex }) => (
        <Text key={label} style={[pdfStyles.tableHeaderCell, { flex }]}>{label}</Text>
      ))}
    </View>
  )
}

function RoomTableRow({ name, alt, l }: { name: string; alt: boolean; l: L }) {
  const style = alt ? pdfStyles.tableRowAlt : pdfStyles.tableRow
  const cols = [1.4, 1, 1, 1, 1, 1.6]
  return (
    <View style={style}>
      <Text style={[pdfStyles.tableCell, { flex: cols[0] }]}>{name}</Text>
      {cols.slice(1).map((flex, i) => (
        <Text key={i} style={[pdfStyles.tableCell, { flex }]}> </Text>
      ))}
    </View>
  )
}

function ApplianceTableHeader({ l }: { l: L }) {
  const cols = [
    { label: l.appl_name, flex: 2 },
    { label: l.appl_present, flex: 0.8 },
    { label: l.appl_condition, flex: 1 },
    { label: l.appl_remarks, flex: 2 },
  ]
  return (
    <View style={pdfStyles.tableHeader}>
      {cols.map(({ label, flex }) => (
        <Text key={label} style={[pdfStyles.tableHeaderCell, { flex }]}>{label}</Text>
      ))}
    </View>
  )
}

function ApplianceRow({ name, alt }: { name: string; alt: boolean }) {
  const style = alt ? pdfStyles.tableRowAlt : pdfStyles.tableRow
  return (
    <View style={style}>
      <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{name}</Text>
      <Text style={[pdfStyles.tableCell, { flex: 0.8 }]}> </Text>
      <Text style={[pdfStyles.tableCell, { flex: 1 }]}> </Text>
      <Text style={[pdfStyles.tableCell, { flex: 2 }]}> </Text>
    </View>
  )
}

export function UebergabeprotokollPdf(data: UebergabeprotokollData) {
  const loc = data.locale in i18n ? data.locale : 'de'
  const l = i18n[loc]
  const isAuszug = data.handoverType === 'auszug'
  const title = isAuszug ? l.type_auszug : l.type_einzug
  const subtitle = isAuszug ? l.subtitle_auszug : l.subtitle_einzug

  const rooms = [
    l.room_entrance,
    l.room_living,
    l.room_kitchen,
    l.room_bath,
    l.room_bedroom,
    l.room_bedroom2,
    l.room_balcony,
    l.room_basement,
  ]
  const appliances = [
    l.appl_stove,
    l.appl_fridge,
    l.appl_dishwasher,
    l.appl_washer,
    l.appl_blinds,
    l.appl_boiler,
  ]

  return (
    <PdfLayout companyName={data.companyName} title={title} subtitleText={subtitle}>

      {/* Info Box */}
      <View style={pdfStyles.infoBox}>
        <Text style={pdfStyles.infoText}>{isAuszug ? l.info_auszug : l.info_einzug}</Text>
      </View>

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
      {data.floor != null && <FieldRow label={l.floor} value={String(data.floor)} />}
      {data.rooms != null && <FieldRow label={l.rooms} value={`${data.rooms} ${l.rooms_unit}`} />}
      <FieldRow label={l.handover_date} value={formatDate(data.handoverDate, loc)} bold />
      <FieldRow label={l.handover_type} value={title} />

      {/* ── Schlüssel ── */}
      <SectionTitle label={l.s_keys} />
      <FieldRow label={l.key_apt} value={data.keyCount != null ? `${data.keyCount} ${l.keys_unit}` : `______ ${l.keys_unit}`} bold />
      <FieldRow label={l.key_mailbox} value={data.mailboxKeyCount != null ? `${data.mailboxKeyCount} ${l.keys_unit}` : `______ ${l.keys_unit}`} />
      {data.basementKeyCount != null && <FieldRow label={l.key_basement} value={`${data.basementKeyCount} ${l.keys_unit}`} />}
      {data.garagekeyCount != null && <FieldRow label={l.key_garage} value={`${data.garagekeyCount} ${l.keys_unit}`} />}

      {/* ── Zähler ── */}
      <SectionTitle label={l.s_meters} />
      <FieldRow label={l.meter_elec} value={data.electricityMeter ?? '______________________'} />
      {data.gasMeter !== undefined && <FieldRow label={l.meter_gas} value={data.gasMeter ?? '______________________'} />}
      <FieldRow label={l.meter_water} value={data.waterMeter ?? '______________________'} />
      {data.heatMeter !== undefined && <FieldRow label={l.meter_heat} value={data.heatMeter ?? '______________________'} />}

      {/* ── Zustand Räume ── */}
      <SectionTitle label={l.s_rooms} />
      <Text style={[pdfStyles.note, { marginBottom: 4 }]}>{l.rooms_note}</Text>
      <RoomTableHeader l={l} />
      {rooms.map((name, i) => (
        <RoomTableRow key={name} name={name} alt={i % 2 === 1} l={l} />
      ))}

      {/* ── Geräte ── */}
      <SectionTitle label={l.s_appliances} />
      <Text style={[pdfStyles.note, { marginBottom: 4 }]}>{l.appl_note}</Text>
      <ApplianceTableHeader l={l} />
      {appliances.map((name, i) => (
        <ApplianceRow key={name} name={name} alt={i % 2 === 1} />
      ))}

      {/* ── Bemerkungen ── */}
      <SectionTitle label={l.s_remarks} />
      <View style={{ borderBottom: '0.5pt solid #d1d5db', minHeight: 60, paddingBottom: 4, marginBottom: 4 }}>
        <Text style={pdfStyles.note}>{data.remarks ?? l.remarks_placeholder}</Text>
      </View>

      {/* ── Unterschriften ── */}
      <SectionTitle label={l.s_sigs} />
      <Text style={[pdfStyles.note, { marginBottom: 6 }]}>{l.sig_note}</Text>
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
