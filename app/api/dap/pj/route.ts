import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarDapPj } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'
import { isValid, validUntil } from '@/lib/verification-cache'
import { getUserPlan, hasAccess } from '@/lib/plan-guard'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const plan = await getUserPlan(user.id)
    if (!hasAccess(plan, 'enterprise')) {
      return NextResponse.json({ error: 'Plano Enterprise necessário para consulta DAP PJ.' }, { status: 403 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })
    if (!dbUser?.cnpjEncrypted) {
      return NextResponse.json({ error: 'Nenhum CNPJ verificado. Faça a consulta QUOD com CNPJ primeiro.' }, { status: 400 })
    }
    if (!dbUser.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const cached = dbUser.properties[0].agroRate
    if (cached && isValid(cached.dapValidUntil)) {
      return NextResponse.json({
        numeroDAP: cached.dapNumero, razaoSocial: cached.dapSituacao,
        cached: true, validUntil: cached.dapValidUntil,
      })
    }

    const cnpj = decryptCpf(dbUser.cnpjEncrypted)
    const dap = await consultarDapPj(cnpj)
    const propertyId = dbUser.properties[0].id
    const until = validUntil('dap')

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        dapVerifiedAt: new Date(), dapValidUntil: until,
        dapNumero: dap.numeroDAP, dapSituacao: dap.razaoSocial,
        dapData: dap.raw as object,
      },
      create: {
        propertyId,
        dapVerifiedAt: new Date(), dapValidUntil: until,
        dapNumero: dap.numeroDAP, dapSituacao: dap.razaoSocial,
        dapData: dap.raw as object,
      },
    })

    return NextResponse.json({
      numeroDAP: dap.numeroDAP, dataEmissao: dap.dataEmissao,
      dataValidade: dap.dataValidade, cnpj: dap.cnpj,
      razaoSocial: dap.razaoSocial, municipio: dap.municipio, uf: dap.uf,
      nomeRepresentanteLegal: dap.nomeRepresentanteLegal,
      cached: false, validUntil: until,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('DAP PJ erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'CNPJ não encontrado no DAP.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
