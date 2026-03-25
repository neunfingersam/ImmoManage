// lib/qr-invoice.ts — QR-Rechnung Generierung (Demo-Layout, CH ISO 20022)

interface QrInvoiceData {
  iban: string
  creditorName: string
  creditorAddress: string
  creditorCity: string
  amount: number
  currency: 'CHF' | 'EUR'
  reference: string
  debtorName?: string
}

/** Formatiert IBAN mit Leerzeichen (CH-Standard: 4er-Gruppen) */
export function formatSwissIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  return clean.match(/.{1,4}/g)?.join(' ') ?? iban
}

/**
 * Erstellt den QR-Code Payload nach Swiss QR Bill Standard (ISO 20022)
 * Demo-Implementierung: Strukturierter Text ohne echte Bankvalidierung
 */
export function buildQrPayload(data: QrInvoiceData): string {
  const ibanClean = data.iban.replace(/\s/g, '')
  const amountFormatted = data.amount.toFixed(2)

  // Swiss QR Bill Payload Format (vereinfacht für Demo)
  return [
    'SPC',                    // Swiss Payments Code
    '0200',                   // Version
    '1',                      // Coding Type
    ibanClean,                // IBAN
    'K',                      // Creditor Address Type (Kombiniert)
    data.creditorName,        // Creditor Name
    data.creditorAddress,     // Creditor Address Line 1
    data.creditorCity,        // Creditor Address Line 2
    '',                       // Creditor Country Zip (leer bei K)
    '',                       // Creditor Country City (leer bei K)
    'CHE',                    // Creditor Country
    '',                       // Ultimate Creditor (leer)
    '',
    '',
    '',
    '',
    '',
    amountFormatted,          // Amount
    data.currency,            // Currency
    data.debtorName ? 'K' : '', // Debtor Address Type
    data.debtorName ?? '',    // Debtor Name
    '',                       // Debtor Address
    '',
    '',
    '',
    'CHE',
    'NON',                    // Reference Type (NON = ohne strukturierte Referenz)
    '',                       // Reference
    data.reference,           // Unstrukturierte Mitteilung
    'EPD',                    // Trailer
  ].join('\n')
}
