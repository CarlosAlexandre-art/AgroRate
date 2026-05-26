import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    // Query principal — tabelas que existem em todos os ambientes
    const share = await prisma.propertyShare.findUnique({
      where: { inviteToken: token },
      include: {
        property: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            agroRate: true,
            revenues: { orderBy: { date: 'asc' }, select: { amount: true, date: true, category: true, description: true } },
            costs:    { orderBy: { date: 'asc' }, select: { amount: true, date: true, category: true, description: true } },
            documents: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true, category: true, fileUrl: true, fileName: true, expiry: true, createdAt: true } },
          },
        },
      },
    })

    if (!share) return NextResponse.json({ error: 'Acesso inválido' }, { status: 404 })
    if (share.status === 'REVOKED') return NextResponse.json({ error: 'Acesso revogado' }, { status: 403 })
    if (share.status !== 'ACTIVE') return NextResponse.json({ error: 'Convite não aceito ainda', pendente: true }, { status: 403 })

    const p = share.property
    const role = share.role
    const propertyId = p.id

    // Queries opcionais — tabelas que podem não existir em produção
    let certidoes: any[] = []
    let loanContracts: any[] = []
    let garantias: any[] = []

    try { certidoes = await (prisma as any).certidao.findMany({ where: { propertyId }, orderBy: { createdAt: 'desc' } }) } catch {}
    try { loanContracts = await (prisma as any).loanContract.findMany({ where: { propertyId }, orderBy: { dataContratacao: 'desc' } }) } catch {}
    try { if (role === 'COLABORADOR') garantias = await (prisma as any).garantia.findMany({ where: { propertyId }, orderBy: { createdAt: 'desc' } }) } catch {}

    const base = {
      role,
      nomeColaborador: share.nome,
      property: {
        name: p.name,
        location: p.location,
        sizeHectares: Number(p.sizeHectares),
      },
      owner: {
        name: p.user.name,
        phone: p.user.phone,
        email: p.user.email,
      },
      score: p.agroRate ? {
        score: p.agroRate.score,
        category: p.agroRate.category,
        productionScore: p.agroRate.productionScore,
        efficiencyScore: p.agroRate.efficiencyScore,
        behaviorScore: p.agroRate.behaviorScore,
        operationalScore: p.agroRate.operationalScore,
        paymentOnTimeRate: Number(p.agroRate.paymentOnTimeRate),
        dataCompleteness: Number(p.agroRate.dataCompleteness),
        trendHistory: p.agroRate.trendHistory,
        updatedAt: p.agroRate.updatedAt,
      } : null,
    }

    if (role === 'CONTADOR' || role === 'COLABORADOR') {
      return NextResponse.json({
        ...base,
        agroRate: p.agroRate ? {
          quodScore: p.agroRate.quodScore,
          quodFaixa: p.agroRate.quodFaixa,
          cafirNumero: p.agroRate.cafirNumero,
          cafirSituacao: p.agroRate.cafirSituacao,
          carNumero: p.agroRate.carNumero,
          carSituacao: p.agroRate.carSituacao,
          dapNumero: p.agroRate.dapNumero,
          dapSituacao: p.agroRate.dapSituacao,
          cafNumero: p.agroRate.cafNumero,
          cafSituacao: p.agroRate.cafSituacao,
        } : null,
        certidoes,
        revenues: p.revenues,
        costs: p.costs,
        documents: p.documents,
        loanContracts,
        garantias: role === 'COLABORADOR' ? garantias : undefined,
      })
    }

    return NextResponse.json({
      ...base,
      documents: p.documents.map(d => ({ id: d.id, name: d.name, category: d.category, expiry: d.expiry })),
    })
  } catch (e) {
    console.error('[colaborador] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
