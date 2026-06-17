-- Tabela de compartilhamento de propriedade (Acesso Colaborativo / Contador)
-- Rodar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "PropertyShare" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "propertyId"   TEXT        NOT NULL,
  "email"        TEXT        NOT NULL,
  "nome"         TEXT,
  "role"         TEXT        NOT NULL DEFAULT 'VISUALIZADOR',
  "inviteToken"  TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "invitedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt"   TIMESTAMP(3),
  "status"       TEXT        NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "PropertyShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyShare_inviteToken_key"
  ON "PropertyShare"("inviteToken");

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyShare_propertyId_email_key"
  ON "PropertyShare"("propertyId", "email");

CREATE INDEX IF NOT EXISTS "PropertyShare_propertyId_idx"
  ON "PropertyShare"("propertyId");

ALTER TABLE "PropertyShare"
  ADD CONSTRAINT "PropertyShare_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
