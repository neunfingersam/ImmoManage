-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "repairCost" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AgentMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "wasEscalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AgentChat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AgentMessage" ("chatId", "content", "createdAt", "id", "role", "sources", "wasEscalated") SELECT "chatId", "content", "createdAt", "id", "role", "sources", "wasEscalated" FROM "AgentMessage";
DROP TABLE "AgentMessage";
ALTER TABLE "new_AgentMessage" RENAME TO "AgentMessage";
CREATE TABLE "new_PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PasswordResetToken" ("createdAt", "expiresAt", "id", "token", "userId") SELECT "createdAt", "expiresAt", "id", "token", "userId" FROM "PasswordResetToken";
DROP TABLE "PasswordResetToken";
ALTER TABLE "new_PasswordResetToken" RENAME TO "PasswordResetToken";
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE TABLE "new_TicketComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TicketComment" ("authorId", "createdAt", "id", "text", "ticketId") SELECT "authorId", "createdAt", "id", "text", "ticketId" FROM "TicketComment";
DROP TABLE "TicketComment";
ALTER TABLE "new_TicketComment" RENAME TO "TicketComment";
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "size" REAL,
    "rooms" REAL,
    "status" TEXT NOT NULL DEFAULT 'LEER',
    "photos" JSONB,
    CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("floor", "id", "photos", "propertyId", "rooms", "size", "status", "unitNumber") SELECT "floor", "id", "photos", "propertyId", "rooms", "size", "status", "unitNumber" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
