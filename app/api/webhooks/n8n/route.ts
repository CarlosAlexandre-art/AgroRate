import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Webhook receptor para n8n
// Eventos suportados:
//   score.recalculate  — recalcula score de um usuário (chamado quando AgroOS atualiza dados)
//   score.threshold    — verifica se score cruzou limiar e dispara ação
//   agrocore.sync      — sincroniza dados de contratos/avaliações do AgroCore
//   offer.broadcast    — notifica todos os produtores elegíveis sobre nova oferta
//   commission.update  — atualiza status de comissão via n8n

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'agrorate-n8n-secret'

export async function POST(request: NextRequest) {
  try {
    // Valida segredo do webhook
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, payload } = body

    if (!event) return NextResponse.json({ error: 'event é obrigatório' }, { status: 400 })

    // Loga o webhook
    await prisma.webhookLog.create({
      data: { event, payload: payload || {}, source: 'n8n', status: 'processing' },
    })

    let result: Record<string, unknown> = {}

    switch (event) {

      case 'score.recalculate': {
        // n8n chama este evento quando AgroOS atualiza receitas/custos
        const { userId } = payload || {}
        if (!userId) throw new Error('userId obrigatório para score.recalculate')

        // Delega ao endpoint de score existente via fetch interno
        const scoreRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agrorate/score?userId=${userId}`,
          { headers: { 'x-internal': 'n8n' } }
        )
        result = await scoreRes.json()
        result.event = 'score.recalculate'
        result.recalculated = true
        break
      }

      case 'score.threshold': {
        // Verifica se score de um usuário cruzou um limiar para notificação
        const { userId, threshold } = payload || {}
        if (!userId) throw new Error('userId obrigatório')

        const user = await prisma.user.findUnique({
          where: { supabaseId: userId },
          include: { properties: { include: { agroRate: true }, take: 1 } },
        })
        const score = user?.properties[0]?.agroRate?.score ?? 0
        result = { userId, score, threshold, crossed: score >= (threshold || 600) }
        break
      }

      case 'agrocore.sync': {
        // AgroCore notifica que um novo contrato/avaliação foi concluído
        // Agenda recalculo do score do produtor envolvido
        const { supabaseId, eventType } = payload || {}
        if (!supabaseId) throw new Error('supabaseId obrigatório')

        const user = await prisma.user.findUnique({
          where: { supabaseId },
          include: { properties: { take: 1 } },
        })

        if (user?.properties[0]) {
          // Invalida o cache do score para forçar recalculo na próxima chamada
          await prisma.agroRate.updateMany({
            where: { propertyId: user.properties[0].id },
            data: { nextUpdate: new Date() }, // força recalculo imediato
          })
        }
        result = { synced: true, eventType, supabaseId }
        break
      }

      case 'offer.broadcast': {
        // Notifica todos os produtores acima de um score mínimo sobre nova oferta
        const { minScore, partnerName, lineName, maxAmount } = payload || {}
        const minS = minScore || 500

        const eligibleRates = await prisma.agroRate.findMany({
          where: { score: { gte: minS } },
          include: {
            property: {
              include: { user: { select: { id: true, email: true, name: true } } },
            },
          },
        })

        result = {
          event: 'offer.broadcast',
          offer: { partnerName, lineName, maxAmount },
          eligibleCount: eligibleRates.length,
          // n8n usa essa lista para enviar e-mails
          recipients: eligibleRates.map(r => ({
            email: r.property.user.email,
            name: r.property.user.name,
            score: r.score,
          })),
        }
        break
      }

      case 'commission.update': {
        // n8n recebe confirmação do banco e atualiza comissão
        const { commissionId, status, approvedAmount } = payload || {}
        if (!commissionId || !status) throw new Error('commissionId e status obrigatórios')

        const existing = await prisma.commission.findUnique({ where: { id: commissionId } })
        if (!existing) throw new Error('Comissão não encontrada')

        const commissionValue = approvedAmount
          ? Number(approvedAmount) * Number(existing.commissionRate)
          : Number(existing.commissionValue)

        const updated = await prisma.commission.update({
          where: { id: commissionId },
          data: {
            status,
            approvedAmount: approvedAmount ?? undefined,
            commissionValue,
            paidAt: status === 'PAID' ? new Date() : undefined,
          },
        })
        result = updated as unknown as Record<string, unknown>
        break
      }

      default:
        return NextResponse.json({ error: `Evento desconhecido: ${event}` }, { status: 400 })
    }

    // Atualiza log com sucesso
    await prisma.webhookLog.updateMany({
      where: { event, status: 'processing' },
      data: { status: 'completed' },
    })

    return NextResponse.json({ ok: true, event, result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[n8n webhook] error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// GET — health check para o n8n verificar se o endpoint está ativo
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    events: ['score.recalculate', 'score.threshold', 'agrocore.sync', 'offer.broadcast', 'commission.update'],
    timestamp: new Date().toISOString(),
  })
}
