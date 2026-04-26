// Janelas de validade por tipo de verificação
export const VALIDITY_DAYS = {
  quod:   30,   // Score muda mensalmente
  cafir:  365,  // Imóvel rural raramente muda
  car:    365,  // Cadastro ambiental estável
  caf:    180,  // Semestral
  dap:    180,  // Semestral
  dossie: 180,  // Semestral
} as const

export type VerifType = keyof typeof VALIDITY_DAYS

export function validUntil(type: VerifType): Date {
  const d = new Date()
  d.setDate(d.getDate() + VALIDITY_DAYS[type])
  return d
}

export function isValid(until: Date | null | undefined): boolean {
  if (!until) return false
  return new Date(until) > new Date()
}

export function daysLeft(until: Date | null | undefined): number {
  if (!until) return 0
  const diff = new Date(until).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}
