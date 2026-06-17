# AgroRate — Contexto para IA

## O que é
Plataforma de score de crédito rural. Analisa dados do produtor (histórico, certidões, garantias, documentos) e gera um AgroRate Score para facilitar acesso a crédito rural junto a instituições financeiras parceiras.

URL produção: agrorate.app

## Stack
- **Framework**: Next.js 15 App Router, TypeScript
- **Banco**: PostgreSQL (Supabase) — MESMO banco do SmartAgroOS
- **Auth**: Supabase Auth com Google OAuth + email/senha + esqueci senha
- **IA**: Groq API — LLaMA 3.3 70B (`lib/groq.ts`) — NÃO substituir por OpenAI
- **Crédito**: Quod API (bureau de crédito), CAF (KYC), CAFIR, DAP, CAR
- **Contratos**: ClickSign (assinatura digital)
- **Deploy**: Vercel

## Estrutura de Pastas
```
app/
  dashboard/
    config/         → Configurações de conta, LGPD, consentimentos
    credito/        → Solicitação e análise de crédito
    historico/      → Histórico de operações e score
    documentos/     → Upload e análise de documentos
    certidoes/      → Certidões negativas
    garantias/      → Gestão de garantias
    contratos/      → Contratos digitais via ClickSign
    fatores/        → Fatores que compõem o score
    relatorio/      → Relatório de crédito completo
    oryon-legal/    → Consultoria jurídica rural (ORYON Legal)
    equipe-ia/      → IA financeira (20req/h limitado)
    planner-credito/→ Planejamento de crédito
    ...
  api/
    ai/             → Agente financeiro, análise de crédito, histórico
    lgpd/           → Exclusão de dados
    agrorate/       → Score, análise, relatórios
    antifraude/     → Detecção de fraudes
    caf/            → KYC via CAF
    quod/           → Consulta bureau de crédito
    stripe/         → Assinaturas premium
    ...
lib/
  groq.ts           → Cliente Groq singleton
  prisma.ts         → Cliente Prisma singleton (mesmo Supabase do SmartAgroOS)
  rate-limit.ts     → Rate limiter in-memory
  quod.ts           → Cliente Quod API
  supabase/         → createClient() server e client
```

## Dados Sensíveis — Atenção Especial
- **CPF/CNPJ**: nunca retornar em listagens, usar `select` no Prisma
- **Score de crédito**: dado financeiro sensível — LGPD exige consentimento explícito
- **Certidões e documentos**: criptografados em repouso no Supabase Storage
- **Retenção regulatória**: dados financeiros mantidos por 5 anos (Banco Central)

## Padrões de Código
- **Rate limiting**: `rateLimit(key, limite, windowMs)` de `@/lib/rate-limit`  
  AI routes: `rateLimit('ai:userId', 20, 3600_000)` — 20req/hora
- **Auth**: sempre Supabase server-side + `getUser()` antes de qualquer operação
- **Consentimentos**: usuário deve consentir antes de compartilhar score com parceiros
- **Next.js 15**: `searchParams` é Promise

## Integrações Externas
| Serviço | Finalidade | Variável de Env |
|---------|-----------|-----------------|
| Quod | Bureau de crédito | `QUOD_API_KEY` |
| CAF | KYC / verificação de identidade | `CAF_API_KEY` |
| ClickSign | Assinatura digital de contratos | `CLICKSIGN_API_KEY` |
| Groq | IA financeira (LLaMA 3.3 70B) | `GROQ_API_KEY` |
| Resend | Emails transacionais | `RESEND_API_KEY` |

## Regras que Nunca Quebram
1. Nunca push para main sem confirmação explícita
2. Nunca rodar `prisma migrate deploy` em produção sem confirmar
3. Banco compartilhado com SmartAgroOS — migrations impactam os dois sistemas
4. Dados financeiros têm retenção obrigatória de 5 anos mesmo após exclusão de conta

@AGENTS.md
