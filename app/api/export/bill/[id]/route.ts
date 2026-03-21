// app/api/export/bill/[id]/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const bill = await prisma.utilityBill.findFirst({
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
  })

  if (!bill) return new Response('Nicht gefunden', { status: 404 })

  const warmmiete = bill.lease.coldRent + bill.lease.extraCosts
  const dateStr = new Date().toLocaleDateString('de-DE')

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
    @page { margin: 20mm; }
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
      <th style="text-align: right;">Betrag (€)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Kaltmiete (monatlich × 12)</td>
      <td class="amount">${(bill.lease.coldRent * 12).toFixed(2)}</td>
    </tr>
    <tr>
      <td>Vorauszahlung Nebenkosten (monatlich × 12)</td>
      <td class="amount">${(bill.lease.extraCosts * 12).toFixed(2)}</td>
    </tr>
    <tr class="highlight">
      <td>Tatsächliche Nebenkosten ${bill.year}</td>
      <td class="amount">${bill.amount.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Differenz (Vorauszahlung – tatsächlich)</td>
      <td class="amount">${((bill.lease.extraCosts * 12) - bill.amount).toFixed(2)}</td>
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
      <div class="field-value">${bill.lease.coldRent.toFixed(2)} €</div>
    </div>
    <div class="field">
      <div class="field-label">Nebenkosten-Vorauszahlung</div>
      <div class="field-value">${bill.lease.extraCosts.toFixed(2)} €</div>
    </div>
    <div class="field">
      <div class="field-label">Warmmiete</div>
      <div class="field-value" style="font-size: 16px; color: #E8734A;">${warmmiete.toFixed(2)} €</div>
    </div>
  </div>
  <div>
    <div class="section-title">Ergebnis</div>
    ${(bill.lease.extraCosts * 12) >= bill.amount
      ? `<div style="color: #16a34a; font-weight: 600; font-size: 15px;">Guthaben: ${((bill.lease.extraCosts * 12) - bill.amount).toFixed(2)} €</div>
         <div style="font-size: 12px; color: #888; margin-top: 4px;">Der Mieter hat zu viel vorausgezahlt.</div>`
      : `<div style="color: #dc2626; font-weight: 600; font-size: 15px;">Nachzahlung: ${(bill.amount - (bill.lease.extraCosts * 12)).toFixed(2)} €</div>
         <div style="font-size: 12px; color: #888; margin-top: 4px;">Der Mieter hat zu wenig vorausgezahlt.</div>`
    }
  </div>
</div>

<div class="footer">
  Erstellt mit ImmoManage · ${dateStr} · Nur zur internen Verwendung
</div>

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
