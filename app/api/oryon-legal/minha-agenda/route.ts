import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('telefone') ?? ''
    const telefone = raw.replace(/\D/g, '')
    if (telefone.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    // Busca pelos últimos 8 dígitos (robusto para qualquer formato salvo)
    const sufixo = telefone.slice(-8)

    const leads = await prisma.oryonLegalLead.findMany({
      where: { telefone: { endsWith: sufixo } },
      include: {
        reunioes: {
          include: { slot: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json(leads)
  } catch {
    return NextResponse.json([])
  }
}
