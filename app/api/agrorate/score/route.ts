import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      include: { revenues: true, costs: true, activities: { where: { status: 'DONE' } } },
    })

    const totalRevenue = property?.revenues.reduce((s, r) => s + Number(r.amount), 0) || 0
    const totalCosts = property?.costs.reduce((s, c) => s + Number(c.amount), 0) || 0
    const marginRate = totalRevenue > 0 ? (totalRevenue - totalCosts) / totalRevenue : 0
    const productivity = totalRevenue / (Number(property?.sizeHectares) || 1)
    const dataCompleteness =
      ((property?.fields.length ?? 0) > 0 ? 20 : 0) +
      (totalCosts > 0 ? 30 : 0) +
      (totalRevenue > 0 ? 30 : 0) +
      ((property?.activities.length ?? 0) > 0 ? 20 : 0)

    const agroRate = await prisma.agroRate.upsert({
      where: { propertyId: targetPropertyId! },
      update: {
        score: totalScore, category: getCategory(totalScore),
        productionScore, efficiencyScore, behaviorScore, operationalScore,
        totalRevenue, totalCosts, productivity, marginRate,
        activityCount: property?.activities.length || 0,
        dataCompleteness,
        lastCalculated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        propertyId: targetPropertyId!,
        score: totalScore, category: getCategory(totalScore),
        productionScore, efficiencyScore, behaviorScore, operationalScore,
        totalRevenue, totalCosts, productivity, marginRate,
        activityCount: property?.activities.length || 0,
        dataCompleteness,
        lastCalculated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(agroRate)
  } catch (error) {
    console.error('Erro AgroRate score:', error)
    return NextResponse.json({ error: 'Erro interno ao calcular score' }, { status: 500 })
  }
}
