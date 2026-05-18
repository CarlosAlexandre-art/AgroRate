import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/lib/agent-engine'

const db = prisma as any

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const agents = await db.agentConfig.findMany({
    where: { ativo: true, trigger: 'CRON' },
    select: { id: true, userId: true, nome: true },
  })

  const results: { id: string; nome: string; ok: boolean; erro?: string }[] = []

  for (const agent of agents) {
    try {
      await runAgent(agent.id, agent.userId)
      results.push({ id: agent.id, nome: agent.nome, ok: true })
    } catch (e: any) {
      results.push({ id: agent.id, nome: agent.nome, ok: false, erro: e?.message })
    }
  }

  return NextResponse.json({ rodados: results.length, results })
}
