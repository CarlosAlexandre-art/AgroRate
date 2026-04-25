import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: {
      properties: {
        take: 1,
        include: {
          fields: { take: 1, select: { id: true } },
          teamMembers: { take: 1, select: { id: true } },
          revenues: { take: 1, select: { id: true } },
          costs: { take: 1, select: { id: true } },
          activities: { where: { status: 'DONE' }, take: 1, select: { id: true } },
          documents: { take: 1, select: { id: true } },
          agroRate: { select: { quodVerifiedAt: true } },
        },
      },
    },
  })

  if (!user || !user.properties[0]) {
    return NextResponse.json({
      hasProperty: false,
      hasFields: false,
      hasRevenues: false,
      hasCosts: false,
      hasTeam: false,
      hasActivities: false,
      hasDocuments: false,
      hasQuod: false,
      sizeHectares: 0,
    })
  }

  const p = user.properties[0]
  return NextResponse.json({
    hasProperty: true,
    hasFields: p.fields.length > 0,
    hasRevenues: p.revenues.length > 0,
    hasCosts: p.costs.length > 0,
    hasTeam: p.teamMembers.length > 0,
    hasActivities: p.activities.length > 0,
    hasDocuments: p.documents.length > 0,
    hasQuod: !!p.agroRate?.quodVerifiedAt,
    sizeHectares: Number(p.sizeHectares),
  })
}
