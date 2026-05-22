-- Migration: criar tabelas CreditPlan e BankConsent
-- Executar via Supabase SQL Editor ou: npx prisma migrate deploy

CREATE TABLE IF NOT EXISTS "CreditPlan" (
  "id"               TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"       TEXT         NOT NULL,
  "safra"            TEXT         NOT NULL,
  "cultura"          TEXT,
  "areaHectares"     DECIMAL(10,2),
  "necessidades"     TEXT,
  "totalNecessidade" DECIMAL(12,2),
  "observacoes"      TEXT,
  "status"           TEXT         NOT NULL DEFAULT 'RASCUNHO',
  "iaAnalise"        TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreditPlan_pkey" PRIMARY KEY ("id")
);

-- FK para Property
ALTER TABLE "CreditPlan"
  ADD CONSTRAINT "CreditPlan_propertyId_fkey"
  FOREIGN KEY ("propertyId")
  REFERENCES "Property"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Índice
CREATE INDEX IF NOT EXISTS "CreditPlan_propertyId_idx" ON "CreditPlan"("propertyId");

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'credit_plan_updated_at'
  ) THEN
    CREATE TRIGGER credit_plan_updated_at
      BEFORE UPDATE ON "CreditPlan"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── BankConsent ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "BankConsent" (
  "id"          TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT         NOT NULL,
  "institution" TEXT         NOT NULL,
  "active"      BOOLEAN      NOT NULL DEFAULT false,
  "grantedAt"   TIMESTAMP(3),
  "revokedAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BankConsent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BankConsent_userId_institution_key" UNIQUE ("userId", "institution")
);

ALTER TABLE "BankConsent"
  ADD CONSTRAINT "BankConsent_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "BankConsent_userId_idx" ON "BankConsent"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'bank_consent_updated_at'
  ) THEN
    CREATE TRIGGER bank_consent_updated_at
      BEFORE UPDATE ON "BankConsent"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
