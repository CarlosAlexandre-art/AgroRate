import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const scores = await prisma.agroRate.findMany({
      include: {
        property: {
          select: {
            name: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { score: 'desc' },
    })
    return NextResponse.json({ scores })
  } catch (err) {
    console.error('Admin scores error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
