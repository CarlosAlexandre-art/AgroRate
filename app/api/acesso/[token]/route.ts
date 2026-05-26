import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const share = await prisma.propertyShare.findUnique({
      where: { inviteToken: token },
      include: {
        property: {
          select: {
            name: true,
            location: true,
            sizeHectares: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    })

    if (!share) return NextResponse.json({ error: 'Convite não encontrado ou inválido' }, { status: 404 })
    if (share.status === 'REVOKED') return NextResponse.json({ error: 'Este convite foi revogado pelo produtor' }, { status: 410 })

    return NextResponse.json({
      id: share.id,
      email: share.email,
      nome: share.nome,
      role: share.role,
      status: share.status,
      invitedAt: share.invitedAt,
      acceptedAt: share.acceptedAt,
      property: {
        name: share.property.name,
        location: share.property.location,
        sizeHectares: Number(share.property.sizeHectares),
        ownerName: share.property.user.name,
        ownerPhone: share.property.user.phone,
        ownerEmail: share.property.user.email,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const share = await prisma.propertyShare.findUnique({
      where: { inviteToken: token },
    })

    if (!share) return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    if (share.status === 'REVOKED') return NextResponse.json({ error: 'Convite revogado' }, { status: 410 })
    if (share.status === 'ACTIVE') return NextResponse.json({ ok: true })

    await prisma.propertyShare.update({
      where: { inviteToken: token },
      data: { status: 'ACTIVE', acceptedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
