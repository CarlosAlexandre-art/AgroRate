import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { stripe, PRICES, type PlanKey, type BillingInterval } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { plan, interval } = await request.json() as { plan: PlanKey; interval: BillingInterval }

    const priceId = PRICES[plan]?.[interval]
    if (!priceId) return NextResponse.json({ error: 'Plano ou intervalo inválido.' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const origin = request.headers.get('origin') ?? 'https://agrorate.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: dbUser.stripeCustomerId ?? undefined,
      customer_email: dbUser.stripeCustomerId ? undefined : dbUser.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/assinaturas?success=1`,
      cancel_url:  `${origin}/dashboard/assinaturas?canceled=1`,
      metadata: { supabaseId: user.id, plan, interval },
      subscription_data: { metadata: { supabaseId: user.id, plan } },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
