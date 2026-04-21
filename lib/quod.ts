import { createHash, createCipheriv, createDecipheriv } from 'crypto'

const DIRECT_DATA_URL = 'https://apiv3.directd.com.br/api/Score'
const TOKEN = process.env.DIRECTDATA_TOKEN || ''
const ENC_KEY = (process.env.CPF_ENCRYPTION_KEY || 'agroratecpfkey32bytespadding!!!!').slice(0, 32)
const ENC_IV  = (process.env.CPF_ENCRYPTION_IV  || 'agroratecpfiv16b').slice(0, 16)

export type QuodResult = {
  score: number
  faixaScore: string
  capacidadePagamento: string
  perfil: string
}

export async function consultarQuod(cpf: string): Promise<QuodResult> {
  const cpfLimpo = cpf.replace(/\D/g, '')
  const url = `${DIRECT_DATA_URL}?CPF=${cpfLimpo}&CNPJ=&Token=${TOKEN}`

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DirectData ${res.status}: ${text}`)
  }

  const data = await res.json()
  const pf = data?.retorno?.pessoaFisica
  if (!pf) throw new Error('Resposta inválida da DirectData')

  return {
    score: Number(pf.score) || 0,
    faixaScore: pf.faixaScore || '',
    capacidadePagamento: pf.capacidadePagamento || '',
    perfil: pf.perfil || '',
  }
}

export function encryptCpf(cpf: string): string {
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(ENC_IV))
  return cipher.update(cpf.replace(/\D/g, ''), 'utf8', 'hex') + cipher.final('hex')
}

export function decryptCpf(encrypted: string): string {
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(ENC_IV))
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
}

export function hashCpf(cpf: string): string {
  return createHash('sha256').update(cpf.replace(/\D/g, '')).digest('hex')
}

export function maskCpf(cpf: string): string {
  const c = cpf.replace(/\D/g, '')
  return `···.···.${c.slice(6, 9)}-${c.slice(9, 11)}`
}
