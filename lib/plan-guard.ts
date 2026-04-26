import { prisma } from '@/lib/prisma'

export type PlanTier = 'starter' | 'pro' | 'enterprise'

const PLAN_RANK: Record<string, number> = {
  starter:    0,
  pro:        1,
  enterprise: 2,
}

export function hasAccess(userPlan: string, required: PlanTier): boolean {
  if (userPlan === 'admin') return true
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[required] ?? 99)
}

export function canForce(userPlan: string): boolean {
  return userPlan === 'admin' || hasAccess(userPlan, 'enterprise')
}

export async function getUserPlan(supabaseId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
    select: { plan: true },
  })
  return user?.plan ?? 'starter'
}

export const PLAN_APIS: Record<PlanTier, string[]> = {
  starter:    [],
  pro:        ['quod'],
  enterprise: ['quod', 'cafir', 'car', 'caf', 'dap', 'dossie', 'antifraude'],
}
