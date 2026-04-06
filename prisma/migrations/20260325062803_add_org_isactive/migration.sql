-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "gstNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "businessType" TEXT,
    "businessPreferences" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Organization" ("address", "businessPreferences", "businessType", "createdAt", "email", "gstNumber", "id", "legalName", "name", "phone", "updatedAt") SELECT "address", "businessPreferences", "businessType", "createdAt", "email", "gstNumber", "id", "legalName", "name", "phone", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_email_key" ON "Organization"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
