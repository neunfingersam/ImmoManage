import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { parsePropertyRow, parseTenantRow, validateImportData, parseSwissDate } from '@/lib/excel-import'
import bcrypt from 'bcryptjs'
import { sendTenantInviteEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = session.user.companyId
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const objekteSheet = wb.Sheets['Objekte']
  const mieterSheet = wb.Sheets['Mieter']

  if (!objekteSheet || !mieterSheet) {
    return NextResponse.json({ error: 'Sheets "Objekte" und "Mieter" nicht gefunden' }, { status: 400 })
  }

  const rawProperties = XLSX.utils.sheet_to_json<Record<string, unknown>>(objekteSheet)
  const rawTenants = XLSX.utils.sheet_to_json<Record<string, unknown>>(mieterSheet)

  const globalErrors = validateImportData({ properties: rawProperties, tenants: rawTenants })
  const rowErrors: Array<{ sheet: string; row: number; error: string }> = []

  const validProperties = rawProperties.map((row, i) => {
    const result = parsePropertyRow({
      name: row['Name'],
      address: row['Adresse'],
      type: row['Typ (MFH/EFH/Gewerbe)'],
      unitCount: Number(row['Anzahl Einheiten']),
      year: row['Baujahr'] ? Number(row['Baujahr']) : undefined,
    })
    if (!result.success) rowErrors.push({ sheet: 'Objekte', row: i + 2, error: result.error })
    return result.success ? result.data : null
  }).filter(Boolean)

  const validTenants = rawTenants.map((row, i) => {
    const result = parseTenantRow({
      firstName: row['Vorname'],
      lastName: row['Nachname'],
      email: row['E-Mail'],
      phone: row['Telefon'],
      iban: row['IBAN'],
      propertyName: row['Objekt-Name'],
      unitNumber: row['Einheit-Nr'],
      startDate: row['Mietbeginn (DD.MM.YYYY)'],
      endDate: row['Mietende (optional)'],
      coldRent: Number(row['Kaltmiete (CHF)']),
      extraCosts: Number(row['Nebenkosten (CHF)']),
    })
    if (!result.success) rowErrors.push({ sheet: 'Mieter', row: i + 2, error: result.error })
    return result.success ? result.data : null
  }).filter(Boolean)

  if (globalErrors.length > 0 || rowErrors.length > 0) {
    return NextResponse.json({
      errors: [...globalErrors, ...rowErrors.map((e) => `${e.sheet} Zeile ${e.row}: ${e.error}`)],
    }, { status: 422 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const createdProperties: Record<string, string> = {}

    for (const prop of validProperties) {
      const created = await tx.property.create({
        data: {
          companyId,
          name: prop!.name,
          address: prop!.address,
          type: prop!.type,
          unitCount: prop!.unitCount,
        },
      })
      createdProperties[prop!.name] = created.id
    }

    let tenantsCreated = 0
    const createdTenants: Array<{ id: string; name: string; email: string }> = []

    for (const tenant of validTenants) {
      const propertyId = createdProperties[tenant!.propertyName]
      if (!propertyId) continue

      const unit = await tx.unit.create({
        data: {
          propertyId,
          unitNumber: tenant!.unitNumber,
          status: 'VERMIETET',
        },
      })

      const tempPassword = crypto.randomBytes(32).toString('hex')
      const passwordHash = await bcrypt.hash(tempPassword, 12)
      const user = await tx.user.create({
        data: {
          companyId,
          name: `${tenant!.firstName} ${tenant!.lastName}`,
          email: tenant!.email,
          phone: tenant!.phone,
          iban: tenant!.iban,
          passwordHash,
          role: 'MIETER',
        },
      })

      const startDate = parseSwissDate(tenant!.startDate) ?? new Date()
      const endDate = tenant!.endDate ? (parseSwissDate(tenant!.endDate) ?? undefined) : undefined

      await tx.lease.create({
        data: {
          companyId,
          unitId: unit.id,
          tenantId: user.id,
          startDate,
          endDate,
          coldRent: tenant!.coldRent,
          extraCosts: tenant!.extraCosts,
          status: 'ACTIVE',
        },
      })

      createdTenants.push({ id: user.id, name: user.name, email: user.email })
      tenantsCreated++
    }

    return { propertiesCreated: validProperties.length, tenantsCreated, createdTenants }
  })

  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.user.id,
      action: 'EXCEL_IMPORT',
      entity: 'Import',
      meta: { propertiesCreated: result.propertiesCreated, tenantsCreated: result.tenantsCreated },
    },
  })

  // Send invite emails to all imported tenants so they can set their own password
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } })
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  await Promise.all(
    result.createdTenants.map(async (tenant) => {
      // Generate invite token (reuse PasswordResetToken, expires in 72h)
      await prisma.passwordResetToken.deleteMany({ where: { userId: tenant.id } })
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: { token, userId: tenant.id, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
      })
      const inviteUrl = `${baseUrl}/auth/reset-password?token=${token}`
      await sendTenantInviteEmail({
        tenantEmail: tenant.email,
        tenantName: tenant.name,
        companyName: company?.name ?? 'ImmoManage',
        inviteUrl,
        expiresHours: 72,
      }).catch(() => {})
    })
  )

  const { createdTenants: _dropped, ...counts } = result
  return NextResponse.json({ success: true, ...counts })
}
