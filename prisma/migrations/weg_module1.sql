-- WEG Module 1 Migration
-- Run against production Turso DB:
--   turso db shell <your-db-name> < prisma/migrations/weg_module1.sql

-- CreateTable
CREATE TABLE IF NOT EXISTS "WegConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "kanton" TEXT,
    "gebVersicherungswert" REAL,
    "fondsBeitragssatz" REAL NOT NULL DEFAULT 0.4,
    "fondsObergrenze" REAL NOT NULL DEFAULT 5.0,
    "fondsStand" REAL,
    "fondsLetzteEinzahlung" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WegConfig_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RenewalPlanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wegConfigId" TEXT NOT NULL,
    "bauteil" TEXT NOT NULL,
    "restlebensdauer" INTEGER,
    "erneuerungskosten" REAL,
    "letzteErneuerung" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RenewalPlanItem_wegConfigId_fkey" FOREIGN KEY ("wegConfigId") REFERENCES "WegConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CommunityExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wegConfigId" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL DEFAULT 'SONSTIGES',
    "beschreibung" TEXT,
    "betrag" REAL NOT NULL,
    "rhythmus" TEXT NOT NULL DEFAULT 'JAEHRLICH',
    "status" TEXT NOT NULL DEFAULT 'OFFEN',
    "lieferant" TEXT,
    "faelligkeitsdatum" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityExpense_wegConfigId_fkey" FOREIGN KEY ("wegConfigId") REFERENCES "WegConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OwnerExpensePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "betrag" REAL NOT NULL,
    "bezahltAm" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OFFEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OwnerExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "CommunityExpense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OwnerExpensePayment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WegTaxEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "steuerjahr" INTEGER NOT NULL,
    "kanton" TEXT,
    "eigenmietwert" REAL,
    "abzugsmethode" TEXT NOT NULL DEFAULT 'PAUSCHAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WegTaxEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WegTaxDeduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taxEntryId" TEXT NOT NULL,
    "datum" DATETIME,
    "beschreibung" TEXT NOT NULL,
    "betrag" REAL NOT NULL,
    "kategorie" TEXT NOT NULL,
    CONSTRAINT "WegTaxDeduction_taxEntryId_fkey" FOREIGN KEY ("taxEntryId") REFERENCES "WegTaxEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Assembly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wegConfigId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "ort" TEXT,
    "einladungsFrist" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'GEPLANT',
    "protokoll" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assembly_wegConfigId_fkey" FOREIGN KEY ("wegConfigId") REFERENCES "WegConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgendaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assemblyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "antragsteller" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgendaItem_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AssemblyVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agendaItemId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "stimme" TEXT NOT NULL,
    CONSTRAINT "AssemblyVote_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssemblyVote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AssemblyAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assemblyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "anwesend" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AssemblyAttendance_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssemblyAttendance_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add new columns to existing tables (SQLite ALTER TABLE)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "isWeg" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PropertyOwner" ADD COLUMN IF NOT EXISTS "wertquote" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PropertyOwner" ADD COLUMN IF NOT EXISTS "hypothekarbetrag" REAL;
ALTER TABLE "PropertyOwner" ADD COLUMN IF NOT EXISTS "hypothekarzins" REAL;
ALTER TABLE "PropertyOwner" ADD COLUMN IF NOT EXISTS "bankverbindung" TEXT;
ALTER TABLE "PropertyOwner" ADD COLUMN IF NOT EXISTS "zahlungsIban" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WegConfig_propertyId_key" ON "WegConfig"("propertyId");
CREATE UNIQUE INDEX IF NOT EXISTS "AssemblyVote_agendaItemId_ownerId_key" ON "AssemblyVote"("agendaItemId", "ownerId");
CREATE UNIQUE INDEX IF NOT EXISTS "AssemblyAttendance_assemblyId_ownerId_key" ON "AssemblyAttendance"("assemblyId", "ownerId");
