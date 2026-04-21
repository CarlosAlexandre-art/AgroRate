import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarQuod, encryptCpf, hashCpf, maskCpf } from '@/lib/quod'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { cpf } = await request.json()
    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Consulta QUOD via Direct Data
    const quod = await consultarQuod(cpf)

    // Salva CPF criptografado no usuário
    await prisma.user.update({
      where: { supabaseId: user.id },
      data: {
        cpfEncrypted: encryptCpf(cpf),
        cpfHash: hashCpf(cpf),
        cpfMasked: maskCpf(cpf),
      },
    })

    // Salva score QUOD na propriedade principal
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })

    if (dbUser?.properties[0]) {
      const propertyId = dbUser.properties[0].id
      await prisma.agroRate.upsert({
        where: { propertyId },
        update: {
          quodScore: quod.score,
          quodFaixa: quod.faixaScore,
          quodCapacidade: quod.capacidadePagamento,
          quodVerifiedAt: new Date(),
        },
        create: {
          propertyId,
          quodScore: quod.score,
          quodFaixa: quod.faixaScore,
          quodCapacidade: quod.capacidadePagamento,
          quodVerifiedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      score: quod.score,
      faixa: quod.faixaScore,
      capacidade: quod.capacidadePagamento,
      cpfMasked: maskCpf(cpf),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('QUOD erro:', msg)
    // Token não configurado ainda
    if (msg.includes('401') || msg.includes('Token')) {
      return NextResponse.json({ error: 'Token Direct Data não configurado. Aguarde ativação.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
