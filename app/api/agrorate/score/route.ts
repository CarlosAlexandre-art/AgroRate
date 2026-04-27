import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAgrocoreData, calcAgrocoreBonus } from '@/lib/prisma-agrocore'

const WEIGHTS = { production: 0.30, efficiency: 0.25, behavior: 0.25, operational: 0.20 }

async function calcProduction(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      revenues: { where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      fields: true,
      activities: { where: { status: 'DONE', endDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
    },
  })
  if (!property) return 0
  const revenue = property.revenues.reduce((s, r) => s + Number(r.amount), 0)
  const area = Number(property.sizeHectares) || 1
  const prodScore = Math.min(1000, (revenue / area / 50) * 1000)
  const actScore = Math.min(1000, (property.activities.length / 12) * 1000)
  const areaScore = area > 50 ? 800 : area > 20 ? 600 : 400
  return Math.round(prodScore * 0.5 + actScore * 0.3 + areaScore * 0.2)
}

async function calcEfficiency(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      revenues: { where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      costs: { where: { date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
    },
  })
  if (!property) return 0
  const revenue = property.revenues.reduce((s, r) => s + Number(r.amount), 0)
  const costs = property.costs.reduce((s, c) => s + Number(c.amount), 0)
  const margin = revenue > 0 ? (revenue - costs) / revenue : 0
  const marginScore = Math.min(1000, (margin / 0.30) * 1000)
  const costRatio = revenue > 0 ? Math.min(1000, (revenue / (costs || 1)) * 500) : 0
  return Math.round(marginScore * 0.6 + costRatio * 0.4)
}

async function calcBehavior(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { costs: { orderBy: { date: 'asc' }, take: 12 } },
  })
  if (!property || property.costs.length === 0) return 500
  const rates = []
  for (let i = 1; i < property.costs.length; i++) {
    const diff = Math.abs(new Date(property.costs[i].date).getTime() - new Date(property.costs[i - 1].date).getTime()) / 86400000
    rates.push(diff <= 35 ? 1 : diff <= 45 ? 0.8 : 0.5)
  }
  const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0.7
  const regScore = Math.min(1000, (property.costs.length / 12) * 1000)
  return Math.round(regScore * 0.3 + avg * 1000 * 0.7)
}

async function calcOperational(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      activities: { where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } },
      costs: true,
      revenues: true,
      fields: true,
      teamMembers: true,
    },
  })
  if (!property) return 0
  const completeness =
    (property.fields.length > 0 ? 20 : 0) +
    (property.teamMembers.length > 0 ? 20 : 0) +
    (property.costs.length > 0 ? 30 : 0) +
    (property.revenues.length > 0 ? 30 : 0)
  const actScore = Math.min(1000, (property.activities.length / 6) * 1000)
  return Math.round(actScore * 0.4 + completeness * 10 * 0.6)
}

function getCategory(score: number) {
  if (score >= 900) return 'ELITE'
  if (score >= 750) return 'HIGH'
  if (score >= 600) return 'GOOD'
  if (score >= 450) return 'REGULAR'
  if (score >= 300) return 'LOW'
  return 'CRITICAL'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const userId = searchParams.get('userId')

    if (!propertyId && !userId) {
      return NextResponse.json({ error: 'propertyId ou userId é obrigatório' }, { status: 400 })
    }

    let targetPropertyId = propertyId

    if (!propertyId && userId) {
      const user = await prisma.user.findUnique({
        where: { supabaseId: userId },
        include: { properties: { take: 1 } },
      })
      if (!user || user.properties.length === 0) {
        return NextResponse.json({ error: 'Nenhuma propriedade encontrada. Configure sua fazenda no AgroOS.' }, { status: 404 })
      }
      targetPropertyId = user.properties[0].id
    }

    const [productionScore, efficiencyScore, behaviorScore, operationalScore] = await Promise.all([
      calcProduction(targetPropertyId!),
      calcEfficiency(targetPropertyId!),
      calcBehavior(targetPropertyId!),
      calcOperational(targetPropertyId!),
    ])

    const totalScore = Math.round(
      productionScore * WEIGHTS.production +
      efficiencyScore * WEIGHTS.efficiency +
      behaviorScore * WEIGHTS.behavior +
      operationalScore * WEIGHTS.operational
    )

    const property = await prisma.property.findUnique({
      where: { id: targetPropertyId! },
      include: { revenues: true, costs: true, fields: true, activities: { where: { status: 'DONE' } } },
    })

    const totalRevenue = property?.revenues.reduce((s, r) => s + Number(r.amount), 0) || 0
    const totalCosts = property?.costs.reduce((s, c) => s + Number(c.amount), 0) || 0
    const marginRate = totalRevenue > 0 ? (totalRevenue - totalCosts) / totalRevenue : 0
    const productivity = totalRevenue / (Number(property?.sizeHectares) || 1)
    const dataCompleteness =
      ((property?.fields?.length ?? 0) > 0 ? 20 : 0) +
      (totalCosts > 0 ? 30 : 0) +
      (totalRevenue > 0 ? 30 : 0) +
      ((property?.activities?.length ?? 0) > 0 ? 20 : 0)

    // Bônus documental: documentos válidos aumentam o score
    let documentBonus = 0
    try {
      const MAX_DOC_IMPACT = 540
      const MAX_DOC_BONUS = 80
      const docs = await prisma.propertyDocument.findMany({ where: { propertyId: targetPropertyId! } })
      const now2 = new Date()
      const docImpact = docs.reduce((sum, d) => {
        if (!d.expiry) return sum + d.scoreImpact
        const diff = (new Date(d.expiry).getTime() - now2.getTime()) / (1000 * 60 * 60 * 24)
        return diff >= 0 ? sum + d.scoreImpact : sum
      }, 0)
      documentBonus = Math.round((docImpact / MAX_DOC_IMPACT) * MAX_DOC_BONUS)
    } catch { /* fallback: documentBonus = 0 */ }

    // Integração AgroCore: busca dados de serviços/reputação e aplica bônus no score
    const supabaseIdForBonus = userId || null
    let agrocoreBonus = 0
    let agrocoreData = null
    if (supabaseIdForBonus) {
      agrocoreData = await getAgrocoreData(supabaseIdForBonus)
      if (agrocoreData) agrocoreBonus = calcAgrocoreBonus(agrocoreData)
    }

    // Integração QUOD: se CPF verificado, score híbrido (70% interno + 30% QUOD)
    const agroRateExistente = await prisma.agroRate.findUnique({ where: { propertyId: targetPropertyId! } })
    const quodScore = agroRateExistente?.quodScore ?? null
    const scoreComBonus = Math.min(1000, totalScore + agrocoreBonus)
    const scoreComQuod = quodScore !== null
      ? Math.min(1000, Math.round(scoreComBonus * 0.70 + quodScore * 0.30))
      : scoreComBonus

    // Bônus/penalidade das verificações Direct Data
    let verificacaoBonus = 0
    if (agroRateExistente) {
      const ar = agroRateExistente as Record<string, unknown>
      // DAP ativa = agricultor apto PRONAF (maior credibilidade)
      if (ar.dapNumero && ar.dapSituacao && String(ar.dapSituacao).toLowerCase().includes('ativ')) verificacaoBonus += 50
      else if (ar.dapNumero) verificacaoBonus += 20
      // CAR ativo = regularidade ambiental
      if (ar.carNumero && String(ar.carSituacao ?? '').toLowerCase().includes('ativo')) verificacaoBonus += 30
      else if (ar.carNumero) verificacaoBonus += 10
      // CAFIR = imóvel registrado no INCRA
      if (ar.cafirNumero) verificacaoBonus += 25
      // CAF = agricultura familiar homologada
      if (ar.cafNumero && String(ar.cafSituacao ?? '').toLowerCase().includes('ativ')) verificacaoBonus += 20
      else if (ar.cafNumero) verificacaoBonus += 8
      // Dossiê: penalidade por pendências/protestos/ações judiciais
      if (ar.dossieData) {
        const d = ar.dossieData as Record<string, unknown>
        const pendencias = Number(d.pendencias ?? 0)
        const protestos  = Number(d.protestos ?? 0)
        const acoes      = Number(d.acoesJudiciais ?? 0)
        if (pendencias > 0) verificacaoBonus -= Math.min(50, pendencias * 10)
        if (protestos > 0)  verificacaoBonus -= Math.min(30, protestos * 15)
        if (acoes > 0)      verificacaoBonus -= Math.min(20, acoes * 10)
      }
    }
    const finalScore = Math.min(1000, Math.max(0, scoreComQuod + verificacaoBonus + documentBonus))

    // Maintain monthly trendHistory snapshot
    const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    const now = new Date()
    const monthLabel = `${MONTHS[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`
    const existingHistory: {month: string; score: number; date: string}[] =
      (agroRateExistente?.trendHistory as any[]) ?? []
    const hasMonth = existingHistory.some(e => e.month === monthLabel)
    const newHistory = hasMonth
      ? existingHistory.map(e => e.month === monthLabel ? { ...e, score: finalScore } : e)
      : [...existingHistory, { month: monthLabel, score: finalScore, date: now.toISOString() }].slice(-12)

    const agroRate = await prisma.agroRate.upsert({
      where: { propertyId: targetPropertyId! },
      update: {
        score: finalScore, category: getCategory(finalScore),
        productionScore, efficiencyScore, behaviorScore, operationalScore,
        totalRevenue, totalCosts, productivity, marginRate,
        activityCount: property?.activities.length || 0,
        dataCompleteness,
        trendHistory: newHistory,
        lastCalculated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        propertyId: targetPropertyId!,
        score: finalScore, category: getCategory(finalScore),
        productionScore, efficiencyScore, behaviorScore, operationalScore,
        totalRevenue, totalCosts, productivity, marginRate,
        activityCount: property?.activities.length || 0,
        dataCompleteness,
        trendHistory: newHistory,
        lastCalculated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      ...agroRate,
      agrocoreBonus,
      verificacaoBonus,
      documentBonus,
      agrocoreConnected: agrocoreData !== null,
    })
  } catch (error) {
    console.error('Erro AgroRate score:', error)
    return NextResponse.json({ error: 'Erro interno ao calcular score' }, { status: 500 })
  }
}
