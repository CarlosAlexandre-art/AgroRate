import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minScore = Number(searchParams.get('minScore') || '0')
    const limit = Number(searchParams.get('limit') || '50')

    const rates = await prisma.agroRate.findMany({
      where: { score: { gte: minScore } },
      include: { property: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { score: 'desc' },
      take: limit,
    })

    const leads = rates.map(r => ({
      score: r.score,
      category: r.category,
      productionScore: r.productionScore,
      efficiencyScore: r.efficiencyScore,
      marginRate: Number(r.marginRate),
      lastCalculated: r.lastCalculated,
      property: { location: r.property.location, sizeHectares: Number(r.property.sizeHectares) },
    }))

    return NextResponse.json(leads)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
  }
}
