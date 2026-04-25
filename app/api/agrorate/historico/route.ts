import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function fmt(date: Date | string) {
  const d = new Date(date)
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser?.properties[0]) return NextResponse.json({ events: [], trendHistory: [] })

    const propertyId = dbUser.properties[0].id

    const [activities, revenues, costs, agroRate] = await Promise.all([
      prisma.activity.findMany({
        where: { propertyId, status: 'DONE' },
        orderBy: { updatedAt: 'desc' },
        take: 12,
      }),
      prisma.revenue.findMany({
        where: { propertyId },
        orderBy: { date: 'desc' },
        take: 8,
      }),
      prisma.cost.findMany({
        where: { propertyId },
        orderBy: { date: 'desc' },
        take: 6,
      }),
      prisma.agroRate.findUnique({ where: { propertyId } }),
    ])

    const events: { icon: string; desc: string; pts: string; date: string; rawDate: string }[] = []

    for (const a of activities) {
      events.push({
        icon: '✅',
        desc: `Atividade concluída: ${a.type}`,
        pts: '+12',
        date: fmt(a.updatedAt),
        rawDate: a.updatedAt.toISOString(),
      })
    }

    for (const r of revenues) {
      const val = Number(r.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
      events.push({
        icon: '📈',
        desc: `Receita registrada: ${val}`,
        pts: '+8',
        date: fmt(r.date),
        rawDate: r.date.toISOString(),
      })
    }

    if (costs.length > 0) {
      events.push({
        icon: '📋',
        desc: `Custos lançados regularmente (${costs.length} registros)`,
        pts: '+6',
        date: fmt(costs[0].date),
        rawDate: costs[0].date.toISOString(),
      })
    }

    if (agroRate?.quodVerifiedAt) {
      events.push({
        icon: '🏦',
        desc: `Score bureau verificado (${agroRate.quodTipo ?? 'PF'})`,
        pts: '+30',
        date: fmt(agroRate.quodVerifiedAt),
        rawDate: agroRate.quodVerifiedAt.toISOString(),
      })
    }

    events.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())

    const trendHistory = (agroRate?.trendHistory as {month: string; score: number; date: string}[]) ?? []

    return NextResponse.json({
      events: events.slice(0, 15),
      trendHistory,
      createdAt: dbUser.properties[0].createdAt,
      currentScore: agroRate?.score ?? 500,
    })
  } catch (error) {
    console.error('Historico API error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
