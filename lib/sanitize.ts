/** Remove tags HTML e limita tamanho de strings */
export function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, maxLength)
}

/** Valida e normaliza telefone BR */
export function sanitizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 13) return null
  return digits
}

// ─── Mascaramento para exibição (Item 32 — Exposição mínima de dados) ───────

/** jo***@email.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || local.length <= 2) return `${local[0]}***@${domain ?? ''}`
  return `${local.slice(0, 2)}***@${domain}`
}

/** (85) *****-1234 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^55/, '')
  if (digits.length < 10) return '(**) *****-****'
  const ddd = digits.slice(0, 2)
  const last4 = digits.slice(-4)
  return `(${ddd}) *****-${last4}`
}

/** ***.***.456-78 */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return '***.***.***-**'
  return `***.***${digits.slice(6, 9)}-${digits.slice(9)}`
}
