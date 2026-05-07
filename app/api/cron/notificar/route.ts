import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificacoesAgroRate } from '@/lib/notificacoes'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const hour = now.getHours()
  
  const isMorning = hour < 12
  const titulo = isMorning ? 'Seu Score AgroRate de Hoje! 💳' : 'Como está sua saúde financeira? 📊'
  const mensagem = isMorning 
    ? 'Acesse o AgroRate e veja se houve mudanças no seu score de crédito hoje. Novas oportunidades podem ter surgido!'
    : 'Finalize o dia conferindo seu progresso no AgroRate. Adicionar novos documentos pode aumentar seu limite de crédito.'

  try {
    const usuarios = await prisma.user.findMany({
      where: { email: { not: '' } },
      select: { id: true }
    })

    let count = 0
    for (const user of usuarios) {
      await NotificacoesAgroRate.notificacaoGeral(
        user.id,
        titulo,
        mensagem,
        isMorning ? 'INFO' : 'REMINDER'
      ).catch(() => {})

      count++
      // Delay para não sobrecarregar APIs externas (Push/Email)
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    return NextResponse.json({ ok: true, processados: count })
  } catch (error) {
    console.error('Erro no cron de notificações AgroRate:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
