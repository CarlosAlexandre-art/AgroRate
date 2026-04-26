import Stripe from 'stripe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any,
})

export const PRICES = {
  pro: {
    monthly:   process.env.STRIPE_PRICE_PRO_MONTHLY   ?? 'price_1TQIzXHOdd4LjuVTllGSYwq9',
    quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY ?? 'price_1TQJ1JHOdd4LjuVTvMWzn2Ky',
    annual:    process.env.STRIPE_PRICE_PRO_ANNUAL    ?? 'price_1TQJ1vHOdd4LjuVT53AV6Adt',
  },
  enterprise: {
    monthly:   process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY   ?? 'price_1TQJ3HHOdd4LjuVTplgdUjgQ',
    quarterly: process.env.STRIPE_PRICE_ENTERPRISE_QUARTERLY ?? 'price_1TQJ45HOdd4LjuVTI6sHY8mU',
    annual:    process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL    ?? 'price_1TQJ5qHOdd4LjuVTiZ8CbQjm',
  },
} as const

export type PlanKey = keyof typeof PRICES
export type BillingInterval = keyof typeof PRICES.pro

export function planFromPriceId(priceId: string): string {
  for (const [plan, intervals] of Object.entries(PRICES)) {
    if (Object.values(intervals).includes(priceId)) return plan
  }
  return 'starter'
}
