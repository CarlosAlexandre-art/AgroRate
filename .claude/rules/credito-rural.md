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

## Integração com Ecossistema
- AgroOS tem seção "AgroRate" marcada como "Em breve"
- AgroCore pode referenciar crédito para financiar serviços agrícolas
