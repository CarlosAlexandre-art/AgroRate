import { NextRequest, NextResponse } from 'next/server'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')!
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const supabaseId = session.metadata?.supabaseId
        const plan       = session.metadata?.plan ?? 'starter'
        const customerId = session.customer as string
        if (supabaseId) {
          await prisma.user.update({
            where: { supabaseId },
            data: { plan, stripeCustomerId: customerId },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const supabaseId = sub.metadata?.supabaseId
        const priceId    = sub.items.data[0]?.price.id
        const plan       = planFromPriceId(priceId)
        const active     = sub.status === 'active' || sub.status === 'trialing'
        if (supabaseId) {
          await prisma.user.update({
            where: { supabaseId },
            data: { plan: active ? plan : 'starter' },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const supabaseId = sub.metadata?.supabaseId
        if (supabaseId) {
          await prisma.user.update({
            where: { supabaseId },
            data: { plan: 'starter' },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler erro:', err)
  }

  return NextResponse.json({ received: true })
}
