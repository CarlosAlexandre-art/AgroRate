import { PrismaClient } from '@prisma/client'

// Cliente separado para consultar dados do AgroCore (mesmo banco, tabelas diferentes)
// Requer AGROCORE_DATABASE_URL no .env (pode ser igual ao DATABASE_URL se mesmo Supabase)
const globalForAgrocore = globalThis as unknown as { agrocorePrisma: PrismaClient }

export const agrocorePrisma =
  globalForAgrocore.agrocorePrisma ??
  new PrismaClient({
    datasources: { db: { url: process.env.AGROCORE_DATABASE_URL || process.env.DATABASE_URL } },
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForAgrocore.agrocorePrisma = agrocorePrisma

// Busca dados de serviços AgroCore de um produtor via supabaseId
export async function getAgrocoreData(supabaseId: string) {
  try {
    // Busca o usuário AgroCore pelo supabaseId
    const agrocoreUser = await agrocorePrisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User" WHERE "supabaseId" = ${supabaseId} LIMIT 1
    `
    if (!agrocoreUser.length) return null

    const userId = agrocoreUser[0].id

    // Busca o Produtor vinculado ao User
    const produtor = await agrocorePrisma.$queryRaw<{
      id: string; avaliacao: number; totalAvaliacoes: number
    }[]>`
      SELECT id, avaliacao, "totalAvaliacoes" FROM "Produtor" WHERE "userId" = ${userId} LIMIT 1
    `
    if (!produtor.length) return null

    const produtorId = produtor[0].id

    // Busca serviços concluídos nos últimos 12 meses
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const services = await agrocorePrisma.$queryRaw<{
      id: string; status: string; precoFinal: number | null; createdAt: Date
    }[]>`
      SELECT id, status, "precoFinal", "createdAt"
      FROM "Service"
      WHERE "produtorId" = ${produtorId}
        AND "createdAt" >= ${twelveMonthsAgo}
    `

    const completedServices = services.filter(s => s.status === 'CONCLUIDO')
    const totalServiceVolume = completedServices.reduce((s, svc) => s + (svc.precoFinal || 0), 0)

    // Busca avaliações recebidas como produtor
    const reviews = await agrocorePrisma.$queryRaw<{ nota: number }[]>`
      SELECT nota FROM "AvaliacaoProdutor"
      WHERE "produtorId" = ${produtorId}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `

    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.nota, 0) / reviews.length
      : 0

    return {
      completedServicesCount: completedServices.length,
      totalServicesCount: services.length,
      totalServiceVolume,
      avgRating,
      totalReviews: reviews.length,
      producerRating: produtor[0].avaliacao,
      producerTotalReviews: produtor[0].totalAvaliacoes,
    }
  } catch (err) {
    // AgroCore DB pode não estar acessível — falha silenciosa
    console.warn('[AgroCore integration] Could not fetch data:', err)
    return null
  }
}

// Calcula o bônus de score vindo do AgroCore (máx +150 pontos)
export function calcAgrocoreBonus(data: NonNullable<Awaited<ReturnType<typeof getAgrocoreData>>>) {
  // Histórico de serviços contratados (comportamento comercial)
  const serviceScore = Math.min(100, (data.completedServicesCount / 10) * 100)

  // Reputação como produtor (0-5 → 0-100)
  const reputationScore = data.avgRating > 0 ? (data.avgRating / 5) * 100 : 50

  // Volume financeiro movimentado no AgroCore
  const volumeScore = Math.min(100, (data.totalServiceVolume / 50000) * 100)

  // Peso: serviços 40%, reputação 40%, volume 20%
  const bonus = Math.round(serviceScore * 0.4 + reputationScore * 0.4 + volumeScore * 0.2)

  // Normalizado para +0 a +150 pontos de bônus no score final
  return Math.round((bonus / 100) * 150)
}
