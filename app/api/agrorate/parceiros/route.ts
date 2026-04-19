import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const partners = await prisma.creditPartner.findMany({
      where: { isActive: true },
      include: { _count: { select: { requests: true } }, offers: { where: { isActive: true } } },
      orderBy: { priority: 'asc' },
    })
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar parceiros' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, apiEndpoint, logoUrl } = await request.json()
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    const max = await prisma.creditPartner.aggregate({ _max: { priority: true } })
    const partner = await prisma.creditPartner.create({
      data: { name, type: type || 'BANK', apiEndpoint, logoUrl, priority: (max._max.priority || 0) + 1 },
    })
    return NextResponse.json(partner, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar parceiro' }, { status: 500 })
  }
}
