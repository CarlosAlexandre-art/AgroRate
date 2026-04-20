import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [users, scores, requests, commissions] = await Promise.all([
      prisma.user.count(),
      prisma.agroRate.aggregate({ _avg: { score: true }, _count: true }),
      prisma.creditRequest.count(),
      prisma.commission.groupBy({ by: ['status'], _sum: { commissionValue: true }, _count: true }),
    ])

    const getVal = (status: string) =>
      Number(commissions.find(c => c.status === status)?._sum.commissionValue ?? 0)

    return NextResponse.json({
      totalUsers: users,
      totalScores: scores._count,
      avgScore: Math.round(scores._avg.score ?? 0),
      totalRequests: requests,
      pendingCommissions: commissions.find(c => c.status === 'PENDING')?._count ?? 0,
      totalCommissionPending: getVal('PENDING') + getVal('CONFIRMED'),
      totalCommissionApproved: getVal('APPROVED'),
      totalCommissionPaid: getVal('PAID'),
    })
  } catch (err) {
    console.error('Admin summary error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
