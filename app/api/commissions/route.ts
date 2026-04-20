import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET — lista comissões (admin ou do produtor logado)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')

    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: { properties: { select: { id: true } } },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const allowedPropertyIds = user.role === 'ADMIN'
      ? undefined
      : user.properties.map(p => p.id)

    const commissions = await prisma.commission.findMany({
      where: {
        ...(allowedPropertyIds ? { propertyId: { in: allowedPropertyIds } } : {}),
        ...(propertyId ? { propertyId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        property: { select: { name: true, user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalPending = commissions
      .filter(c => c.status === 'PENDING' || c.status === 'CONFIRMED')
      .reduce((s, c) => s + Number(c.commissionValue), 0)
    const totalApproved = commissions
      .filter(c => c.status === 'APPROVED' || c.status === 'PAID')
      .reduce((s, c) => s + Number(c.commissionValue), 0)
    const totalPaid = commissions
      .filter(c => c.status === 'PAID')
      .reduce((s, c) => s + Number(c.commissionValue), 0)

    return NextResponse.json({ commissions, summary: { totalPending, totalApproved, totalPaid } })
  } catch (err) {
    console.error('Commissions GET error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST — registra nova comissão quando produtor solicita crédito
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { propertyId, partnerName, partnerType, lineOfCredit, requestedAmount, creditRequestId } = body

    if (!propertyId || !partnerName || !requestedAmount) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Taxa de comissão por tipo de parceiro (Plano Safra 2025/26 — valores de referência)
    const rateByType: Record<string, number> = {
      BANK: 0.008,        // 0.8% — bancos tradicionais
      COOPERATIVE: 0.010, // 1.0% — cooperativas
      FINTECH: 0.015,     // 1.5% — fintechs (mais ágeis, ticket menor)
    }
    const commissionRate = rateByType[partnerType] ?? 0.010

    const commission = await prisma.commission.create({
      data: {
        propertyId,
        creditRequestId: creditRequestId || undefined,
        partnerName,
        partnerType: partnerType || 'BANK',
        lineOfCredit,
        requestedAmount,
        commissionRate,
        commissionValue: 0, // calculado ao aprovar
        status: 'PENDING',
      },
    })

    return NextResponse.json(commission, { status: 201 })
  } catch (err) {
    console.error('Commissions POST error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH — atualiza status (aprovado/pago/rejeitado) — usado pelo admin ou n8n
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, approvedAmount } = body

    if (!id || !status) return NextResponse.json({ error: 'id e status obrigatórios' }, { status: 400 })

    const existing = await prisma.commission.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Comissão não encontrada' }, { status: 404 })

    const commissionValue = approvedAmount
      ? Number(approvedAmount) * Number(existing.commissionRate)
      : Number(existing.commissionValue)

    const updated = await prisma.commission.update({
      where: { id },
      data: {
        status,
        approvedAmount: approvedAmount ?? existing.approvedAmount,
        commissionValue,
        paidAt: status === 'PAID' ? new Date() : existing.paidAt,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Commissions PATCH error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
