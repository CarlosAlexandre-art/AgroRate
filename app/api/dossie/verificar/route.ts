import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarDossie } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser?.cpfEncrypted && !dbUser?.cnpjEncrypted) {
      return NextResponse.json({ error: 'Verifique CPF ou CNPJ primeiro na aba QUOD.' }, { status: 400 })
    }
    if (!dbUser.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const cpf  = dbUser.cpfEncrypted  ? decryptCpf(dbUser.cpfEncrypted)  : ''
    const cnpj = dbUser.cnpjEncrypted ? decryptCpf(dbUser.cnpjEncrypted) : undefined

    const dossie = await consultarDossie(cpf, cnpj)
    const propertyId = dbUser.properties[0].id

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        dossieVerifiedAt: new Date(),
        dossieData:       dossie.raw as object,
      },
      create: {
        propertyId,
        dossieVerifiedAt: new Date(),
        dossieData:       dossie.raw as object,
      },
    })

    return NextResponse.json({
      tipo:             dossie.tipo,
      nome:             dossie.nome,
      situacao:         dossie.situacaoCadastral,
      scorePf:          dossie.scorePf,
      pendencias:       dossie.pendencias,
      protestos:        dossie.protestos,
      acoesJudiciais:   dossie.acoesJudiciais,
      chequesSemFundo:  dossie.chequesSemFundo,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Dossiê erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
