import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ─── Limites por plano ───────────────────────────────────────────────────────

export const PLANO_LIMITES = {
  // AGRORATE - Plataforma de Crédito Rural
  starter: {
    nome: 'Gratuito',
    preco: 'R$ 0/mês',
    scoreCalculo: true,
    scoreHistorico: false,
    simulacaoCredito: false,
    documentosUpload: false,
    verificacoesQUOD: false,
    verificacoesCAFIR: false,
    verificacoesCAR: false,
    iaConselheiro: false,
    benchmarking: false,
    exportacaoPDF: false,
    notificacoesEmail: false,
    compartilhamentoBancos: false,
  },
  pro: {
    nome: 'Profissional',
    preco: 'R$ 147/mês ou R$ 1.470/ano',
    scoreCalculo: true,
    scoreHistorico: true,
    simulacaoCredito: true,
    documentosUpload: true,
    verificacoesQUOD: true,
    verificacoesCAFIR: false,
    verificacoesCAR: false,
    iaConselheiro: true,
    benchmarking: true,
    exportacaoPDF: true,
    notificacoesEmail: true,
    compartilhamentoBancos: true,
  },
  enterprise: {
    nome: 'Empresarial',
    preco: 'R$ 397/mês ou R$ 3.970/ano',
    scoreCalculo: true,
    scoreHistorico: true,
    simulacaoCredito: true,
    documentosUpload: true,
    verificacoesQUOD: true,
    verificacoesCAFIR: true,
    verificacoesCAR: true,
    iaConselheiro: true,
    benchmarking: true,
    exportacaoPDF: true,
    notificacoesEmail: true,
    compartilhamentoBancos: true,
    verificacoesDossie: true,
    apiIntegracoes: true,
    suportePrioritario: true,
  },
  admin: {
    nome: 'Administrador',
    preco: 'Acesso total',
    scoreCalculo: true,
    scoreHistorico: true,
    simulacaoCredito: true,
    documentosUpload: true,
    verificacoesQUOD: true,
    verificacoesCAFIR: true,
    verificacoesCAR: true,
    iaConselheiro: true,
    benchmarking: true,
    exportacaoPDF: true,
    notificacoesEmail: true,
    compartilhamentoBancos: true,
    verificacoesDossie: true,
    apiIntegracoes: true,
    suportePrioritario: true,
  },
}

export function getLimites(plan: string) {
  return PLANO_LIMITES[plan as keyof typeof PLANO_LIMITES] ?? PLANO_LIMITES.starter
}

// ─── Helper: busca usuário + plano ──────────────────────────────────────────

export async function getUserPlan(supabaseId: string) {
  const dbUser = await prisma.user.findUnique({ where: { supabaseId } })
  const plan = (dbUser as any)?.plan ?? 'starter'
  return { dbUser, plan, limites: getLimites(plan) }
}

// ─── Resposta padrão de bloqueio ─────────────────────────────────────────────

export function planoBloqueado(recurso: string, planoAtual: string) {
  return NextResponse.json(
    { error: 'PLAN_LIMIT', recurso, plano: planoAtual },
    { status: 403 }
  )
}

// ─── Guard de verificação de acesso ───────────────────────────────────────────

export function hasAccess(plan: string, recurso: string): boolean {
  const limites = getLimites(plan)
  return (limites as any)[recurso] === true
}

// ─── Preços para Stripe ─────────────────────────────────────────────────────

export const STRIPE_PRICES = {
  'smartagros-pro': 'price_smartagros_pro_monthly',
  'smartagros-enterprise': 'price_smartagros_enterprise_monthly', 
  'smartagros-pro-yearly': 'price_smartagros_pro_yearly',
  'smartagros-enterprise-yearly': 'price_smartagros_enterprise_yearly',
  'agrorate-pro': 'price_agrorate_pro_monthly',
  'agrorate-enterprise': 'price_agrorate_enterprise_monthly',
  'agrorate-pro-yearly': 'price_agrorate_pro_yearly',
  'agrorate-enterprise-yearly': 'price_agrorate_enterprise_yearly',
}
