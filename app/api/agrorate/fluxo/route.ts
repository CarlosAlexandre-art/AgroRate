import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const ano = parseInt(searchParams.get('ano') ?? String(new Date().getFullYear()), 10)

    if (!userId) return NextResponse.json({ lancamentos: [] })

    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
      include: { properties: { take: 1 } },
    })
    const propertyId = user?.properties[0]?.id
    if (!propertyId) return NextResponse.json({ lancamentos: [] })

    const start = new Date(`${ano}-01-01`)
    const end = new Date(`${ano}-12-31T23:59:59`)

    const [revenues, costs] = await Promise.all([
      prisma.revenue.findMany({
        where: { propertyId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      prisma.cost.findMany({
        where: { propertyId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
    ])

    const lancamentos = [
      ...revenues.map(r => ({ id: r.id, tipo: 'RECEITA', descricao: r.description || 'Receita', amount: Number(r.amount), date: r.date.toISOString(), category: r.category })),
      ...costs.map(c => ({ id: c.id, tipo: 'CUSTO', descricao: c.description || 'Custo', amount: Number(c.amount), date: c.date.toISOString(), category: String(c.category) })),
    ]

    return NextResponse.json({ lancamentos })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ lancamentos: [] })
  }
}
