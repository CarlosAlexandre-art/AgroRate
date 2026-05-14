---
description: Regras do AgroRate — plataforma de crédito rural, cuidados especiais com dados financeiros
---

# AgroRate — Crédito Rural

## Contexto
AgroRate é a plataforma de crédito rural do Ecossistema Agro.
Dados financeiros e de crédito exigem cuidado redobrado.

## Regras Especiais
- Dados de crédito e score: NUNCA expor sem autenticação
- Dados pessoais (CPF, renda, patrimônio): tratar como sensíveis
- Decisões de crédito: nunca automatizar sem revisão humana configurada
- Logs de operações financeiras: manter para auditoria

## Pendentes Conhecidos
- Modal tutorial/onboarding (primeira vez que o usuário entra)
- Planos Stripe para monetização do AgroRate
- Página AgroOS (aba OryonAG): adicionar informações sobre computação inteligente e física quântica — deploy foi feito mas conteúdo não foi atualizado
- Módulo Confinamento Inteligente: gestão de lotes, alimentação, GMD, custo por arroba, IA preditiva (ver planejamento em credito-rural.md)
- Passaporte Digital Animal: rastreabilidade + QR Code + histórico sanitário + conformidade

## Integração com Ecossistema
- AgroOS tem seção "AgroRate" marcada como "Em breve"
- AgroCore pode referenciar crédito para financiar serviços agrícolas

## Módulos Planejados — Pecuária (AgroOS/AgroCore)
### Módulo 1 — Bovino Base (já existe)
- Cadastro, rastreio, transações, histórico

### Módulo 2 — Confinamento Inteligente (premium)
- Cadastro por lote (raça, idade, peso inicial, objetivo)
- Controle diário: ração, água, peso, GMD, medicação, mortalidade
- Dashboard: GMD, custo/arroba, previsão de abate, eficiência alimentar, margem estimada
- IA: lote com pior performance, previsão de peso ideal, tendência sanitária, custo futuro

### Módulo 3 — Qualidade & Rastreabilidade (diferencial de mercado)
- Passaporte Digital Animal com QR Code
- Histórico sanitário: vacinas, alimentação, origem, movimentações, exames
- Conformidade para frigorífico, exportação, leite premium
- Expansão futura: ovinos, caprinos, suínos, aves, piscicultura

## APIs a Avaliar para Integração Pecuária
- AnimalTracker API (elte.hu) — rastreamento animal
- e-cattle API — gestão bovina
- Farmable — integrações agro
