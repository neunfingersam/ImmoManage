import * as XLSX from 'xlsx'
import path from 'path'

const wb = XLSX.utils.book_new()

// Sheet 1: Objekte
const objekteData = [
  ['Name', 'Adresse', 'Typ (MFH/EFH/Gewerbe)', 'Anzahl Einheiten', 'Baujahr'],
  ['Musterhaus', 'Musterstrasse 1, 8001 Zürich', 'MFH', 6, 1985],
  ['Einzelwohnung', 'Beispielgasse 5, 3001 Bern', 'EFH', 1, 1970],
]
const wsObjekte = XLSX.utils.aoa_to_sheet(objekteData)
XLSX.utils.book_append_sheet(wb, wsObjekte, 'Objekte')

// Sheet 2: Mieter
const mieterData = [
  ['Vorname', 'Nachname', 'E-Mail', 'Telefon', 'IBAN', 'Objekt-Name', 'Einheit-Nr', 'Mietbeginn (DD.MM.YYYY)', 'Mietende (optional)', 'Kaltmiete (CHF)', 'Nebenkosten (CHF)'],
  ['Hans', 'Muster', 'hans@example.com', '+41 79 123 45 67', 'CH56 0483 5012 3456 7800 9', 'Musterhaus', '1.OG links', '01.01.2024', '', 1200, 200],
]
const wsMieter = XLSX.utils.aoa_to_sheet(mieterData)
XLSX.utils.book_append_sheet(wb, wsMieter, 'Mieter')

const outputPath = path.join(process.cwd(), 'public/templates/import-vorlage.xlsx')
XLSX.writeFile(wb, outputPath)
console.log(`Excel-Vorlage erstellt: ${outputPath}`)
