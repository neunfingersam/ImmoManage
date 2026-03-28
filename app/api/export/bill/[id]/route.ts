// app/api/export/bill/[id]/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'
import { buildQrPayload, formatSwissIban } from '@/lib/qr-invoice'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const [bill, company] = await Promise.all([
    prisma.utilityBill.findFirst({
      where: { id, companyId: session.user.companyId },
      include: {
        lease: {
          include: {
            tenant: { select: { name: true, email: true, phone: true } },
            unit: { select: { unitNumber: true, floor: true } },
          },
        },
        property: { select: { name: true, address: true } },
      },
    }),
    prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true, smtpConfig: true },
    }),
  ])

  if (!bill) return new Response('Nicht gefunden', { status: 404 })

  const warmmiete = bill.lease.coldRent + bill.lease.extraCosts
  const dateStr = new Date().toLocaleDateString('de-CH')
  const akontoTotal = bill.lease.extraCosts * 12
  const diff = akontoTotal - bill.amount
  const isNachzahlung = diff < 0
  const nachzahlungBetrag = Math.abs(diff)

  // ─── Swiss QR Bill ────────────────────────────────────────────────────────
  const cfg = (company?.smtpConfig ?? {}) as Record<string, string>
  const iban = cfg.bankIban ?? ''
  const hasQrConfig = iban.length >= 15 && cfg.street && cfg.zip && cfg.city
  const companyName = company?.name ?? 'ImmoManage'

  let qrDataUrl = ''
  if (hasQrConfig && isNachzahlung) {
    try {
      const payload = buildQrPayload({
        iban,
        creditorName: companyName,
        creditorAddress: `${cfg.street}, ${cfg.zip} ${cfg.city}`,
        creditorCity: `${cfg.zip} ${cfg.city}`,
        amount: nachzahlungBetrag,
        currency: 'CHF',
        reference: `NK ${bill.year} ${bill.lease.tenant.name}`,
        debtorName: bill.lease.tenant.name,
      })
      qrDataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 0,
        width: 166,
        color: { dark: '#000000', light: '#ffffff' },
      })
    } catch {
      // QR generation failed — continue without it
    }
  }

  const qrSlipHtml = hasQrConfig && isNachzahlung && qrDataUrl ? `
  <!-- QR-Bill Perforationslinie -->
  <div style="margin-top: 40px; border-top: 1px dashed #aaa; padding-top: 8px; display: flex; align-items: center; gap: 8px; color: #aaa; font-size: 10px;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9L12 15L18 9"/></svg>
    Hier abtrennen
  </div>

  <!-- QR-Zahlungsschein -->
  <div style="margin-top: 0; page-break-inside: avoid;">
    <div style="display: flex; border: 1px solid #000; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px;">

      <!-- Empfangsschein -->
      <div style="width: 62mm; border-right: 1px solid #000; padding: 5mm; flex-shrink: 0;">
        <div style="font-size: 11px; font-weight: 700; margin-bottom: 3mm;">Empfangsschein</div>

        <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Konto / Zahlbar an</div>
        <div style="margin-bottom: 3mm; line-height: 1.4;">
          <div>${formatSwissIban(iban)}</div>
          <div>${companyName}</div>
          <div>${cfg.street}</div>
          <div>${cfg.zip} ${cfg.city}</div>
        </div>

        <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Zahlbar durch</div>
        <div style="margin-bottom: 3mm; line-height: 1.4;">
          <div>${bill.lease.tenant.name}</div>
        </div>

        <div style="margin-top: auto;">
          <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Währung</div>
          <div style="display: flex; gap: 10mm;">
            <div>CHF</div>
            <div>
              <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Betrag</div>
              <div>${nachzahlungBetrag.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 3mm; font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6mm;">Annahmestelle</div>
        <div style="height: 8mm; border: 1px solid #000; width: 30mm;"></div>
      </div>

      <!-- Zahlteil -->
      <div style="flex: 1; padding: 5mm;">
        <div style="font-size: 11px; font-weight: 700; margin-bottom: 3mm;">Zahlteil</div>

        <div style="display: flex; gap: 5mm; margin-bottom: 3mm;">
          <!-- QR Code -->
          <div style="flex-shrink: 0;">
            <div style="width: 46mm; height: 46mm; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <img src="${qrDataUrl}" width="166" height="166" style="width: 100%; height: 100%; display: block;" alt="Swiss QR Code" />
            </div>
          </div>

          <!-- Betrag/Währung rechts vom QR -->
          <div>
            <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Währung</div>
            <div style="margin-bottom: 3mm;">CHF</div>
            <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Betrag</div>
            <div style="font-size: 14px; font-weight: 700;">${nachzahlungBetrag.toFixed(2)}</div>
          </div>
        </div>

        <!-- Konto + Empfänger -->
        <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Konto / Zahlbar an</div>
        <div style="margin-bottom: 3mm; line-height: 1.5;">
          <div>${formatSwissIban(iban)}</div>
          <div>${companyName}</div>
          <div>${cfg.street}, ${cfg.zip} ${cfg.city}</div>
        </div>

        <!-- Mitteilung -->
        <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Mitteilung</div>
        <div style="margin-bottom: 3mm;">Nebenkostenabrechnung ${bill.year} · ${bill.lease.tenant.name}</div>

        <!-- Zahlbar durch -->
        <div style="font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1mm;">Zahlbar durch</div>
        <div style="line-height: 1.5;">${bill.lease.tenant.name}</div>
      </div>
    </div>
  </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Nebenkostenabrechnung ${bill.year}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1A2E; background: #fff; padding: 48px; font-size: 14px; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 2px solid #E8734A; padding-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 700; color: #E8734A; letter-spacing: -0.5px; }
  .logo span { color: #1A1A2E; }
  .meta { text-align: right; font-size: 12px; color: #666; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 32px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #888; margin-bottom: 12px; font-weight: 600; }
  .field { margin-bottom: 8px; }
  .field-label { font-size: 11px; color: #888; }
  .field-value { font-weight: 500; }
  .table { width: 100%; border-collapse: collapse; margin: 32px 0; }
  .table th { background: #F0E6D3; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; }
  .table td { padding: 12px 14px; border-bottom: 1px solid #f0f0f0; }
  .table .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row td { font-weight: 700; border-top: 2px solid #1A1A2E; border-bottom: none; font-size: 15px; }
  .highlight { background: #FFF8F5; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
  @media print {
    body { padding: 32px; }
    @page { margin: 15mm; }
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Immo<span>Manage</span></div>
    <div style="font-size: 12px; color: #888; margin-top: 4px;">${bill.property.name}</div>
    <div style="font-size: 12px; color: #888;">${bill.property.address}</div>
  </div>
  <div class="meta">
    <div>Erstellt am ${dateStr}</div>
    <div>Abrechnungsjahr ${bill.year}</div>
  </div>
</div>

<h1>Nebenkostenabrechnung</h1>
<p class="subtitle">Abrechnungszeitraum: 01.01.${bill.year} – 31.12.${bill.year}</p>

<div class="two-col">
  <div>
    <div class="section-title">Mieter</div>
    <div class="field">
      <div class="field-value">${bill.lease.tenant.name}</div>
      ${bill.lease.tenant.email ? `<div class="field-label">${bill.lease.tenant.email}</div>` : ''}
      ${bill.lease.tenant.phone ? `<div class="field-label">${bill.lease.tenant.phone}</div>` : ''}
    </div>
  </div>
  <div>
    <div class="section-title">Mietobjekt</div>
    <div class="field">
      <div class="field-value">${bill.property.name}</div>
      <div class="field-label">${bill.property.address}</div>
    </div>
    <div class="field">
      <div class="field-label">Einheit</div>
      <div class="field-value">${bill.lease.unit.unitNumber}${bill.lease.unit.floor != null ? ` · Etage ${bill.lease.unit.floor}` : ''}</div>
    </div>
  </div>
</div>

<table class="table">
  <thead>
    <tr>
      <th>Position</th>
      <th style="text-align: right;">Betrag (CHF)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Kaltmiete (monatlich × 12)</td>
      <td class="amount">${(bill.lease.coldRent * 12).toFixed(2)}</td>
    </tr>
    <tr>
      <td>Vorauszahlung Nebenkosten (monatlich × 12)</td>
      <td class="amount">${akontoTotal.toFixed(2)}</td>
    </tr>
    <tr class="highlight">
      <td>Tatsächliche Nebenkosten ${bill.year}</td>
      <td class="amount">${bill.amount.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Differenz (Vorauszahlung – tatsächlich)</td>
      <td class="amount">${diff.toFixed(2)}</td>
    </tr>
    <tr class="total-row">
      <td>Gesamtmiete ${bill.year} (Kalt + tatsächliche NK)</td>
      <td class="amount">${(bill.lease.coldRent * 12 + bill.amount).toFixed(2)}</td>
    </tr>
  </tbody>
</table>

<div class="two-col" style="margin-top: 0;">
  <div>
    <div class="section-title">Monatliche Miete</div>
    <div class="field">
      <div class="field-label">Kaltmiete</div>
      <div class="field-value">CHF ${bill.lease.coldRent.toFixed(2)}</div>
    </div>
    <div class="field">
      <div class="field-label">Nebenkosten-Vorauszahlung</div>
      <div class="field-value">CHF ${bill.lease.extraCosts.toFixed(2)}</div>
    </div>
    <div class="field">
      <div class="field-label">Warmmiete</div>
      <div class="field-value" style="font-size: 16px; color: #E8734A;">CHF ${warmmiete.toFixed(2)}</div>
    </div>
  </div>
  <div>
    <div class="section-title">Ergebnis</div>
    ${!isNachzahlung
      ? `<div style="color: #16a34a; font-weight: 600; font-size: 15px;">Guthaben: CHF ${diff.toFixed(2)}</div>
         <div style="font-size: 12px; color: #888; margin-top: 4px;">Der Mieter hat zu viel vorausgezahlt.</div>`
      : `<div style="color: #dc2626; font-weight: 600; font-size: 15px;">Nachzahlung: CHF ${nachzahlungBetrag.toFixed(2)}</div>
         <div style="font-size: 12px; color: #888; margin-top: 4px;">Der Mieter hat zu wenig vorausgezahlt.</div>`
    }
  </div>
</div>

<div class="footer">
  Erstellt mit ImmoManage · ${dateStr} · ${companyName}
</div>

${qrSlipHtml}

<script>
  window.onload = function() { window.print(); }
</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
