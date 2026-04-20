import { prisma } from '@/lib/prisma'

// AgroCore compartilha o mesmo banco (mesmo Supabase) — usa o prisma client existente
// As tabelas do AgroCore são consultadas via $queryRaw

export async function getAgrocoreData(supabaseId: string) {
  try {
    const agrocoreUser = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User" WHERE "supabaseId" = ${supabaseId} LIMIT 1
    `
    if (!agrocoreUser.length) return null

    const userId = agrocoreUser[0].id

    const produtor = await prisma.$queryRaw<{
      id: string; avaliacao: number; totalAvaliacoes: number
    }[]>`
      SELECT id, avaliacao, "totalAvaliacoes" FROM "Produtor" WHERE "userId" = ${userId} LIMIT 1
    `
    if (!produtor.length) return null

    const produtorId = produtor[0].id
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    const services = await prisma.$queryRaw<{
      status: string; precoFinal: number | null
    }[]>`
      SELECT status, "precoFinal" FROM "Service"
      WHERE "produtorId" = ${produtorId}
        AND "createdAt" >= ${twelveMonthsAgo}
    `

    const completed = services.filter(s => s.status === 'CONCLUIDO')
    const totalServiceVolume = completed.reduce((s, svc) => s + (svc.precoFinal || 0), 0)

    const reviews = await prisma.$queryRaw<{ nota: number }[]>`
      SELECT nota FROM "AvaliacaoProdutor"
      WHERE "produtorId" = ${produtorId}
      ORDER BY "createdAt" DESC LIMIT 20
    `

    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.nota, 0) / reviews.length
      : 0

    return {
      completedServicesCount: completed.length,
      totalServicesCount: services.length,
      totalServiceVolume,
      avgRating,
      totalReviews: reviews.length,
      producerRating: produtor[0].avaliacao,
    }
  } catch {
    // AgroCore tables podem não existir no ambiente — falha silenciosa
    return null
  }
}

export function calcAgrocoreBonus(data: NonNullable<Awaited<ReturnType<typeof getAgrocoreData>>>) {
  const serviceScore = Math.min(100, (data.completedServicesCount / 10) * 100)
  const reputationScore = data.avgRating > 0 ? (data.avgRating / 5) * 100 : 50
  const volumeScore = Math.min(100, (data.totalServiceVolume / 50000) * 100)
  const bonus = Math.round(serviceScore * 0.4 + reputationScore * 0.4 + volumeScore * 0.2)
  return Math.round((bonus / 100) * 150)
}
