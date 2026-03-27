export interface TaxI18n {
  title: string
  subtitle: (year: number) => string
  createdBy: string
  totalIncome: string
  repairCostsTotal: string
  flatDeductionTotal: string
  taxableIncomePauschal: string
  taxableIncomeEffektiv: string
  taxableIncomeRecommended: string
  sheetOverview: string
  sheetIncome: string
  colProperty: string
  colUnit: string
  colTenant: string
  colMonths: string
  colRent: string
  colExtra: string
  colTotal: string
  rowTotal: (name: string) => string
  filename: (year: number) => string
  // PDF-specific
  s_summary: string
  bestMethod: string
  s_property: (name: string) => string
  address: string
  buildingYear: string
  grossRent: string
  extraCosts: string
  totalInc: string
  vacancy: string
  repairCosts: string
  pauschalRate: string
  pauschalAmt: string
  taxablePauschal: string
  taxableEffektiv: string
  recommendation: string
  rec_pauschal: string
  rec_effektiv: string
  taxableIncome: string
  s_units: string
  s_note: string
  note1: string
  note2: string
  note3: string
  note4: string
}

const de: TaxI18n = {
  title: 'Steuermappe Liegenschaften',
  subtitle: (year) => `Steuerjahr ${year} — Direkte Bundessteuer & Kantonssteuer`,
  createdBy: 'Erstellt von',
  totalIncome: 'Gesamtertrag',
  repairCostsTotal: 'Unterhaltskosten total',
  flatDeductionTotal: 'Pauschalabzug total',
  taxableIncomePauschal: 'Steuerbares Einkommen (Pauschal)',
  taxableIncomeEffektiv: 'Steuerbares Einkommen (Effektiv)',
  taxableIncomeRecommended: 'Steuerbares Einkommen (empfohlen)',
  sheetOverview: 'Übersicht',
  sheetIncome: 'Erträge',
  colProperty: 'Liegenschaft',
  colUnit: 'Einheit',
  colTenant: 'Mieter',
  colMonths: 'Monate',
  colRent: 'Nettomiete',
  colExtra: 'Nebenkosten',
  colTotal: 'Total',
  rowTotal: (name) => `${name} Total`,
  filename: (year) => `steuermappe-${year}`,
  s_summary: 'GESAMTÜBERSICHT',
  bestMethod: 'Empfohlene Abzugsmethode',
  s_property: (name) => `LIEGENSCHAFT: ${name.toUpperCase()}`,
  address: 'Adresse',
  buildingYear: 'Baujahr',
  grossRent: 'Nettomieterträge',
  extraCosts: 'Nebenkosteneinnahmen',
  totalInc: 'Gesamtertrag',
  vacancy: 'Leerstand (geschätzt)',
  repairCosts: 'Unterhaltskosten (Tickets)',
  pauschalRate: 'Pauschalabzug',
  pauschalAmt: 'Pauschalabzug Betrag',
  taxablePauschal: 'Steuerbares Einkommen (Pauschal)',
  taxableEffektiv: 'Steuerbares Einkommen (Effektiv)',
  recommendation: 'Empfehlung',
  rec_pauschal: 'Pauschalabzug ist günstiger',
  rec_effektiv: 'Effektivkosten sind günstiger',
  taxableIncome: 'Steuerbares Einkommen (empfohlen)',
  s_units: 'EINHEITEN',
  s_note: 'HINWEISE',
  note1: 'Diese Aufstellung dient als Grundlage für die Steuererklärung. Bitte prüfen Sie alle Angaben mit Ihrem Steuerberater.',
  note2: 'Pauschalabzug: 10% bei Gebäudealter < 10 Jahre, 20% bei ≥ 10 Jahre (gemäss DBG Art. 32 Abs. 4).',
  note3: 'Hypothekarzinsen und Versicherungsprämien sind separat in der Steuererklärung einzutragen.',
  note4: 'Leerstand: Mietzinsausfall ist in der Regel in der Steuererklärung anzugeben.',
}

const fr: TaxI18n = {
  title: 'Dossier fiscal immobilier',
  subtitle: (year) => `Année fiscale ${year} — Impôt fédéral direct & impôt cantonal`,
  createdBy: 'Créé par',
  totalIncome: 'Revenus totaux',
  repairCostsTotal: 'Frais d\'entretien total',
  flatDeductionTotal: 'Déduction forfaitaire totale',
  taxableIncomePauschal: 'Revenu imposable (forfaitaire)',
  taxableIncomeEffektiv: 'Revenu imposable (effectif)',
  taxableIncomeRecommended: 'Revenu imposable (recommandé)',
  sheetOverview: 'Vue d\'ensemble',
  sheetIncome: 'Revenus',
  colProperty: 'Bien immobilier',
  colUnit: 'Unité',
  colTenant: 'Locataire',
  colMonths: 'Mois',
  colRent: 'Loyer net',
  colExtra: 'Charges',
  colTotal: 'Total',
  rowTotal: (name) => `${name} Total`,
  filename: (year) => `dossier-fiscal-${year}`,
  s_summary: 'VUE D\'ENSEMBLE',
  bestMethod: 'Méthode de déduction recommandée',
  s_property: (name) => `BIEN IMMOBILIER: ${name.toUpperCase()}`,
  address: 'Adresse',
  buildingYear: 'Année de construction',
  grossRent: 'Revenus locatifs nets',
  extraCosts: 'Revenus charges',
  totalInc: 'Revenus totaux',
  vacancy: 'Vacance (estimée)',
  repairCosts: 'Frais d\'entretien (tickets)',
  pauschalRate: 'Déduction forfaitaire',
  pauschalAmt: 'Montant déduction forfaitaire',
  taxablePauschal: 'Revenu imposable (forfaitaire)',
  taxableEffektiv: 'Revenu imposable (effectif)',
  recommendation: 'Recommandation',
  rec_pauschal: 'La déduction forfaitaire est plus avantageuse',
  rec_effektiv: 'Les frais effectifs sont plus avantageux',
  taxableIncome: 'Revenu imposable (recommandé)',
  s_units: 'UNITÉS',
  s_note: 'REMARQUES',
  note1: 'Ce tableau sert de base pour la déclaration d\'impôt. Vérifiez toutes les données avec votre conseiller fiscal.',
  note2: 'Déduction forfaitaire: 10% si bâtiment < 10 ans, 20% si ≥ 10 ans (selon LIFD art. 32 al. 4).',
  note3: 'Les intérêts hypothécaires et les primes d\'assurance doivent être déclarés séparément.',
  note4: 'Vacance: la perte de loyer doit en règle générale être indiquée dans la déclaration d\'impôt.',
}

const en: TaxI18n = {
  title: 'Property Tax Report',
  subtitle: (year) => `Tax Year ${year} — Federal & Cantonal Tax`,
  createdBy: 'Created by',
  totalIncome: 'Total Income',
  repairCostsTotal: 'Total Maintenance Costs',
  flatDeductionTotal: 'Total Flat-Rate Deduction',
  taxableIncomePauschal: 'Taxable Income (Flat-Rate)',
  taxableIncomeEffektiv: 'Taxable Income (Effective)',
  taxableIncomeRecommended: 'Taxable Income (Recommended)',
  sheetOverview: 'Overview',
  sheetIncome: 'Income',
  colProperty: 'Property',
  colUnit: 'Unit',
  colTenant: 'Tenant',
  colMonths: 'Months',
  colRent: 'Net Rent',
  colExtra: 'Ancillary',
  colTotal: 'Total',
  rowTotal: (name) => `${name} Total`,
  filename: (year) => `tax-report-${year}`,
  s_summary: 'OVERVIEW',
  bestMethod: 'Recommended Deduction Method',
  s_property: (name) => `PROPERTY: ${name.toUpperCase()}`,
  address: 'Address',
  buildingYear: 'Year Built',
  grossRent: 'Net Rental Income',
  extraCosts: 'Ancillary Income',
  totalInc: 'Total Income',
  vacancy: 'Vacancy (estimated)',
  repairCosts: 'Maintenance Costs (Tickets)',
  pauschalRate: 'Flat-Rate Deduction',
  pauschalAmt: 'Flat-Rate Deduction Amount',
  taxablePauschal: 'Taxable Income (Flat-Rate)',
  taxableEffektiv: 'Taxable Income (Effective)',
  recommendation: 'Recommendation',
  rec_pauschal: 'Flat-rate deduction is more favourable',
  rec_effektiv: 'Effective costs are more favourable',
  taxableIncome: 'Taxable Income (Recommended)',
  s_units: 'UNITS',
  s_note: 'NOTES',
  note1: 'This overview serves as a basis for the tax return. Please verify all figures with your tax advisor.',
  note2: 'Flat-rate deduction: 10% if building < 10 years old, 20% if ≥ 10 years (per DFTA Art. 32 para. 4).',
  note3: 'Mortgage interest and insurance premiums must be declared separately in the tax return.',
  note4: 'Vacancy: loss of rent should generally be stated in the tax return.',
}

const it: TaxI18n = {
  title: 'Cartella fiscale immobiliare',
  subtitle: (year) => `Anno fiscale ${year} — Imposta federale diretta & cantonale`,
  createdBy: 'Creato da',
  totalIncome: 'Reddito totale',
  repairCostsTotal: 'Costi di manutenzione totali',
  flatDeductionTotal: 'Deduzione forfettaria totale',
  taxableIncomePauschal: 'Reddito imponibile (forfettario)',
  taxableIncomeEffektiv: 'Reddito imponibile (effettivo)',
  taxableIncomeRecommended: 'Reddito imponibile (raccomandato)',
  sheetOverview: 'Panoramica',
  sheetIncome: 'Redditi',
  colProperty: 'Immobile',
  colUnit: 'Unità',
  colTenant: 'Inquilino',
  colMonths: 'Mesi',
  colRent: 'Pigione netta',
  colExtra: 'Spese acc.',
  colTotal: 'Totale',
  rowTotal: (name) => `${name} Totale`,
  filename: (year) => `cartella-fiscale-${year}`,
  s_summary: 'PANORAMICA',
  bestMethod: 'Metodo di deduzione raccomandato',
  s_property: (name) => `IMMOBILE: ${name.toUpperCase()}`,
  address: 'Indirizzo',
  buildingYear: 'Anno di costruzione',
  grossRent: 'Redditi locativi netti',
  extraCosts: 'Redditi spese accessorie',
  totalInc: 'Reddito totale',
  vacancy: 'Sfitto (stimato)',
  repairCosts: 'Costi di manutenzione (ticket)',
  pauschalRate: 'Deduzione forfettaria',
  pauschalAmt: 'Importo deduzione forfettaria',
  taxablePauschal: 'Reddito imponibile (forfettario)',
  taxableEffektiv: 'Reddito imponibile (effettivo)',
  recommendation: 'Raccomandazione',
  rec_pauschal: 'La deduzione forfettaria è più vantaggiosa',
  rec_effektiv: 'I costi effettivi sono più vantaggiosi',
  taxableIncome: 'Reddito imponibile (raccomandato)',
  s_units: 'UNITÀ',
  s_note: 'NOTE',
  note1: 'Questo riepilogo serve come base per la dichiarazione fiscale. Verificare tutti i dati con il proprio consulente fiscale.',
  note2: 'Deduzione forfettaria: 10% se edificio < 10 anni, 20% se ≥ 10 anni (secondo LIFD art. 32 cpv. 4).',
  note3: 'Gli interessi ipotecari e i premi assicurativi vanno dichiarati separatamente.',
  note4: 'Sfitto: la perdita di pigione va indicata di regola nella dichiarazione fiscale.',
}

export const taxI18n: Record<string, TaxI18n> = { de, fr, en, it }

export function getTaxI18n(locale: string): TaxI18n {
  return taxI18n[locale] ?? de
}
