import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
      include: { properties: { take: 1, include: { creditRequests: { include: { partner: true }, orderBy: { createdAt: 'desc' } } } } },
    })

    if (!user || !user.properties[0]) return NextResponse.json([])
    return NextResponse.json(user.properties[0].creditRequests)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, partnerId, partnerName, lineName, requestedAmount, rate, termMonths } = await request.json()
    if (!userId || !requestedAmount) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
      include: { properties: { take: 1 } },
    })
    if (!user || !user.properties[0]) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const req = await prisma.creditRequest.create({
      data: {
        propertyId: user.properties[0].id,
        partnerId: partnerId ?? null,
        requestedAmount,
        interestRate: rate ?? null,
        termMonths: termMonths ?? null,
        status: 'PENDING',
        proposals: [{ partnerName, lineName, requestedAt: new Date().toISOString() }],
      },
    })
    return NextResponse.json(req, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar solicitação' }, { status: 500 })
  }
}
