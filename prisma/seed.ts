// prisma/seed.ts
// Demo-Daten für die Entwicklungsumgebung
// Alle Passwörter: demo1234
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../lib/generated/prisma'
import { hash } from 'bcryptjs'
import path from 'path'

// DATABASE_URL aus Umgebung lesen, Fallback auf lokale SQLite
const dbUrl = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), 'prisma/dev.db')}`
const authToken = process.env.DATABASE_AUTH_TOKEN
const adapter = new PrismaLibSql({ url: dbUrl, authToken })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter })

async function main() {
  console.log('🌱 Seed-Daten werden erstellt...')

  const passwortHash = await hash('demo1234', 12)

  // 1. Super Admin (ohne Company)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@demo.de' },
    update: {},
    create: {
      email: 'superadmin@demo.de',
      passwordHash: passwortHash,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      active: true,
    },
  })

  // 2. Company anlegen
  const company = await prisma.company.upsert({
    where: { slug: 'demo-gmbh' },
    update: {},
    create: {
      name: 'Demo GmbH',
      slug: 'demo-gmbh',
      active: true,
    },
  })

  // 3. Admin der Company
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.de' },
    update: {},
    create: {
      email: 'admin@demo.de',
      passwordHash: passwortHash,
      role: 'ADMIN',
      name: 'Anna Muster',
      companyId: company.id,
      active: true,
    },
  })

  // 4. Vermieter (2 Stück)
  const vermieter1 = await prisma.user.upsert({
    where: { email: 'vermieter@demo.de' },
    update: {},
    create: {
      email: 'vermieter@demo.de',
      passwordHash: passwortHash,
      role: 'VERMIETER',
      name: 'Max Mustermann',
      phone: '+49 123 456789',
      companyId: company.id,
      active: true,
    },
  })

  const vermieter2 = await prisma.user.upsert({
    where: { email: 'vermieter2@demo.de' },
    update: {},
    create: {
      email: 'vermieter2@demo.de',
      passwordHash: passwortHash,
      role: 'VERMIETER',
      name: 'Lisa Schmidt',
      phone: '+49 987 654321',
      companyId: company.id,
      active: true,
    },
  })

  // 5. Mieter (3 Stück)
  const mieter1 = await prisma.user.upsert({
    where: { email: 'mieter@demo.de' },
    update: {},
    create: {
      email: 'mieter@demo.de',
      passwordHash: passwortHash,
      role: 'MIETER',
      name: 'Thomas Müller',
      phone: '+49 111 222333',
      companyId: company.id,
      active: true,
    },
  })

  const mieter2 = await prisma.user.upsert({
    where: { email: 'mieter2@demo.de' },
    update: {},
    create: {
      email: 'mieter2@demo.de',
      passwordHash: passwortHash,
      role: 'MIETER',
      name: 'Sarah Weber',
      phone: '+49 444 555666',
      companyId: company.id,
      active: true,
    },
  })

  const mieter3 = await prisma.user.upsert({
    where: { email: 'mieter3@demo.de' },
    update: {},
    create: {
      email: 'mieter3@demo.de',
      passwordHash: passwortHash,
      role: 'MIETER',
      name: 'Klaus Bauer',
      phone: '+49 777 888999',
      companyId: company.id,
      active: true,
    },
  })

  // 6. Immobilien (2 Stück)
  const immobilie1 = await prisma.property.upsert({
    where: { id: 'prop-demo-1' },
    update: {},
    create: {
      id: 'prop-demo-1',
      companyId: company.id,
      name: 'Musterstraße 12',
      address: 'Musterstraße 12, 10115 Berlin',
      type: 'MULTI',
      unitCount: 3,
      year: 1985,
      description: 'Schönes Mehrfamilienhaus im Berliner Prenzlauer Berg.',
    },
  })

  const immobilie2 = await prisma.property.upsert({
    where: { id: 'prop-demo-2' },
    update: {},
    create: {
      id: 'prop-demo-2',
      companyId: company.id,
      name: 'Gartenweg 5',
      address: 'Gartenweg 5, 80331 München',
      type: 'SINGLE',
      unitCount: 1,
      year: 2010,
      description: 'Moderne Eigentumswohnung in München.',
    },
  })

  // Property-Zuweisungen
  await prisma.propertyAssignment.upsert({
    where: { userId_propertyId: { userId: vermieter1.id, propertyId: immobilie1.id } },
    update: {},
    create: { userId: vermieter1.id, propertyId: immobilie1.id },
  })

  await prisma.propertyAssignment.upsert({
    where: { userId_propertyId: { userId: vermieter2.id, propertyId: immobilie2.id } },
    update: {},
    create: { userId: vermieter2.id, propertyId: immobilie2.id },
  })

  // 7. Einheiten (4 Stück)
  const einheit1 = await prisma.unit.upsert({
    where: { id: 'unit-demo-1' },
    update: {},
    create: {
      id: 'unit-demo-1',
      propertyId: immobilie1.id,
      unitNumber: 'EG links',
      floor: 0,
      size: 72.5,
      rooms: 3,
    },
  })

  const einheit2 = await prisma.unit.upsert({
    where: { id: 'unit-demo-2' },
    update: {},
    create: {
      id: 'unit-demo-2',
      propertyId: immobilie1.id,
      unitNumber: '1. OG rechts',
      floor: 1,
      size: 58.0,
      rooms: 2,
    },
  })

  const einheit3 = await prisma.unit.upsert({
    where: { id: 'unit-demo-3' },
    update: {},
    create: {
      id: 'unit-demo-3',
      propertyId: immobilie1.id,
      unitNumber: '2. OG',
      floor: 2,
      size: 85.0,
      rooms: 3.5,
    },
  })

  const einheit4 = await prisma.unit.upsert({
    where: { id: 'unit-demo-4' },
    update: {},
    create: {
      id: 'unit-demo-4',
      propertyId: immobilie2.id,
      unitNumber: 'Wohnung',
      floor: 1,
      size: 68.0,
      rooms: 2.5,
    },
  })

  // 8. Mietverträge (3 Stück)
  await prisma.lease.upsert({
    where: { id: 'lease-demo-1' },
    update: {},
    create: {
      id: 'lease-demo-1',
      unitId: einheit1.id,
      tenantId: mieter1.id,
      companyId: company.id,
      status: 'ACTIVE',
      startDate: new Date('2022-01-01'),
      coldRent: 850,
      extraCosts: 180,
      depositPaid: true,
    },
  })

  await prisma.lease.upsert({
    where: { id: 'lease-demo-2' },
    update: {},
    create: {
      id: 'lease-demo-2',
      unitId: einheit2.id,
      tenantId: mieter2.id,
      companyId: company.id,
      status: 'ACTIVE',
      startDate: new Date('2023-03-15'),
      endDate: new Date('2025-03-14'),
      coldRent: 720,
      extraCosts: 150,
      depositPaid: true,
    },
  })

  await prisma.lease.upsert({
    where: { id: 'lease-demo-3' },
    update: {},
    create: {
      id: 'lease-demo-3',
      unitId: einheit4.id,
      tenantId: mieter3.id,
      companyId: company.id,
      status: 'ACTIVE',
      startDate: new Date('2021-07-01'),
      coldRent: 1100,
      extraCosts: 220,
      depositPaid: true,
    },
  })

  // 9. Tickets (2 offene)
  const ticket1 = await prisma.ticket.upsert({
    where: { id: 'ticket-demo-1' },
    update: {},
    create: {
      id: 'ticket-demo-1',
      companyId: company.id,
      propertyId: immobilie1.id,
      tenantId: mieter1.id,
      unitId: einheit1.id,
      title: 'Heizung funktioniert nicht',
      description: 'Seit gestern Abend läuft die Heizung im Wohnzimmer nicht mehr. Die Thermostate reagieren nicht.',
      status: 'OPEN',
      priority: 'HIGH',
      images: JSON.stringify([]),
    },
  })

  await prisma.ticketComment.upsert({
    where: { id: 'comment-demo-1' },
    update: {},
    create: {
      id: 'comment-demo-1',
      ticketId: ticket1.id,
      authorId: vermieter1.id,
      text: 'Ich habe einen Techniker kontaktiert. Er kommt morgen zwischen 10-12 Uhr.',
    },
  })

  await prisma.ticket.upsert({
    where: { id: 'ticket-demo-2' },
    update: {},
    create: {
      id: 'ticket-demo-2',
      companyId: company.id,
      propertyId: immobilie1.id,
      tenantId: mieter2.id,
      unitId: einheit2.id,
      title: 'Wasserhahn tropft',
      description: 'Der Wasserhahn im Badezimmer tropft seit zwei Tagen. Bitte beheben.',
      status: 'OPEN',
      priority: 'MEDIUM',
      images: JSON.stringify([]),
    },
  })

  // 10. Dokument (Hausordnung)
  await prisma.document.upsert({
    where: { id: 'doc-demo-1' },
    update: {},
    create: {
      id: 'doc-demo-1',
      companyId: company.id,
      propertyId: immobilie1.id,
      name: 'Hausordnung Musterstraße 12',
      category: 'HAUSORDNUNG',
      fileUrl: '/uploads/demo/hausordnung-demo.txt',
      fileType: 'text/plain',
      scope: 'PROPERTY',
      uploadedById: vermieter1.id,
      extractedText: `HAUSORDNUNG — Musterstraße 12, 10115 Berlin\n\n§1 Ruhezeiten\nDie Nachtruhe gilt täglich von 22:00 bis 07:00 Uhr sowie von 13:00 bis 15:00 Uhr.\nAn Sonn- und Feiertagen ist die Ruhezeit den ganzen Tag einzuhalten.\n\n§2 Gemeinschaftsräume\nTreppenhaus, Keller und Waschküche sind sauber zu halten.\n\n§3 Müllentsorgung\nMüll ist ausschließlich in den dafür vorgesehenen Behältern zu entsorgen.\n\n§4 Haustiere\nDas Halten von Haustieren bedarf der schriftlichen Genehmigung des Vermieters.\n\n§5 Parkplätze\nDie Mieter dürfen ausschließlich die ihnen zugewiesenen Parkplätze nutzen.`,
      indexed: false,
    },
  })

  // 11. Demo-AgentChat
  const agentChat = await prisma.agentChat.upsert({
    where: { id: 'chat-demo-1' },
    update: {},
    create: {
      id: 'chat-demo-1',
      companyId: company.id,
      tenantId: mieter1.id,
    },
  })

  await prisma.agentMessage.upsert({
    where: { id: 'msg-demo-1' },
    update: {},
    create: {
      id: 'msg-demo-1',
      chatId: agentChat.id,
      role: 'USER',
      content: 'Bis wann gilt die Nachtruhe?',
      sources: JSON.stringify([]),
      wasEscalated: false,
    },
  })

  await prisma.agentMessage.upsert({
    where: { id: 'msg-demo-2' },
    update: {},
    create: {
      id: 'msg-demo-2',
      chatId: agentChat.id,
      role: 'AGENT',
      content: 'Laut der Hausordnung (§1 Ruhezeiten) gilt die Nachtruhe täglich von 22:00 bis 07:00 Uhr sowie von 13:00 bis 15:00 Uhr. An Sonn- und Feiertagen ist die Ruhezeit den ganzen Tag einzuhalten.',
      sources: JSON.stringify(['doc-demo-1']),
      wasEscalated: false,
    },
  })

  await prisma.agentMessage.upsert({
    where: { id: 'msg-demo-3' },
    update: {},
    create: {
      id: 'msg-demo-3',
      chatId: agentChat.id,
      role: 'USER',
      content: 'Kann ich meine Miete für den kommenden Monat stunden?',
      sources: JSON.stringify([]),
      wasEscalated: false,
    },
  })

  await prisma.agentMessage.upsert({
    where: { id: 'msg-demo-4' },
    update: {},
    create: {
      id: 'msg-demo-4',
      chatId: agentChat.id,
      role: 'AGENT',
      content: 'Ich bin mir bei dieser Frage nicht sicher, da sie rechtliche und finanzielle Aspekte betrifft. Ich habe deinen Vermieter benachrichtigt.',
      sources: JSON.stringify([]),
      wasEscalated: true,
    },
  })

  await prisma.message.upsert({
    where: { id: 'msg-escalation-1' },
    update: {},
    create: {
      id: 'msg-escalation-1',
      companyId: company.id,
      fromId: mieter1.id,
      toId: vermieter1.id,
      text: '[Von KI weitergeleitet] Mieter Thomas Müller fragt: "Kann ich meine Miete für den kommenden Monat stunden?"',
      source: 'AI_ESCALATION',
      read: false,
    },
  })

  console.log('✅ Seed erfolgreich abgeschlossen!')
  console.log('')
  console.log('Demo-Zugänge (Passwort: demo1234):')
  console.log('  superadmin@demo.de  → Super Admin')
  console.log('  admin@demo.de       → Admin (Demo GmbH)')
  console.log('  vermieter@demo.de   → Vermieter 1')
  console.log('  vermieter2@demo.de  → Vermieter 2')
  console.log('  mieter@demo.de      → Mieter 1')
  console.log('  mieter2@demo.de     → Mieter 2')
  console.log('  mieter3@demo.de     → Mieter 3')
}

main()
  .catch((e) => {
    console.error('❌ Seed fehlgeschlagen:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
