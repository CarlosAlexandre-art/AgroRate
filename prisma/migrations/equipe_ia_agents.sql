-- AgroRate — Equipe IA
-- NOTA: AgroRate compartilha banco com AgroOS.
-- Se a migration do AgroOS (equipe_ia_agents.sql) já foi rodada, estas tabelas já existem.
-- Use este script APENAS se o AgroRate estiver em banco separado.

CREATE TABLE IF NOT EXISTS "AgentConfig" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"       TEXT        NOT NULL,
  "nome"         TEXT        NOT NULL,
  "role"         TEXT        NOT NULL,
  "tipo"         TEXT        NOT NULL DEFAULT 'CUSTOMIZADO',
  "systemPrompt" TEXT,
  "tools"        TEXT[]      NOT NULL DEFAULT '{}',
  "trigger"      TEXT        NOT NULL DEFAULT 'MANUAL',
  "ativo"        BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentRun" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "agentId"    TEXT        NOT NULL,
  "userId"     TEXT        NOT NULL,
  "status"     TEXT        NOT NULL DEFAULT 'RUNNING',
  "startedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "resultado"  TEXT,
  "toolCalls"  TEXT,
  "erro"       TEXT,
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentConfig_userId_fkey') THEN
    ALTER TABLE "AgentConfig" ADD CONSTRAINT "AgentConfig_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_agentId_fkey') THEN
    ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_agentId_fkey"
      FOREIGN KEY ("agentId") REFERENCES "AgentConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AgentConfig_userId_idx" ON "AgentConfig"("userId");
CREATE INDEX IF NOT EXISTS "AgentRun_agentId_idx"   ON "AgentRun"("agentId");
