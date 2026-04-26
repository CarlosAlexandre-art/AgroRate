const BASE = 'https://apiv3.directd.com.br/api'

function token(key: string) {
  const t = process.env[key] || ''
  if (!t) throw new Error(`Token ${key} não configurado`)
  return t
}

async function get(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}/${endpoint}?${qs}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DirectData ${endpoint} ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── CAFIR ─────────────────────────────────────────────────────────────────
export type CafirResult = {
  numero: string
  area: string
  situacao: string
  municipio?: string
  uf?: string
  raw: unknown
}

export async function consultarCafir(cpf: string): Promise<CafirResult> {
  const data = await get('Cafir', { CPF: cpf.replace(/\D/g, ''), Token: token('DIRECTDATA_CAFIR_TOKEN') })
  const r = data?.retorno ?? data
  return {
    numero:    r?.numeroCafir    || r?.numero    || '',
    area:      r?.areaTotal      || r?.area      || '',
    situacao:  r?.situacao       || '',
    municipio: r?.municipio      || '',
    uf:        r?.uf             || '',
    raw:       data,
  }
}

// ─── CAR ───────────────────────────────────────────────────────────────────
export type CarResult = {
  numero: string
  situacao: string
  areaTotal: string
  municipio?: string
  uf?: string
  raw: unknown
}

export async function consultarCar(cpf: string): Promise<CarResult> {
  const data = await get('Car', { CPF: cpf.replace(/\D/g, ''), Token: token('DIRECTDATA_CAR_TOKEN') })
  const r = data?.retorno ?? data
  return {
    numero:    r?.numeroCar      || r?.numero    || '',
    situacao:  r?.situacao       || '',
    areaTotal: r?.areaTotal      || '',
    municipio: r?.municipio      || '',
    uf:        r?.uf             || '',
    raw:       data,
  }
}

// ─── CAF / DAP ─────────────────────────────────────────────────────────────
export type CafResult = {
  numero: string
  situacao: string
  validade?: string
  modalidade?: string
  raw: unknown
}

export async function consultarCaf(cpf: string): Promise<CafResult> {
  const data = await get('Caf', { CPF: cpf.replace(/\D/g, ''), Token: token('DIRECTDATA_CAF_TOKEN') })
  const r = data?.retorno ?? data
  return {
    numero:     r?.numeroCaf     || r?.numeroDap  || r?.numero  || '',
    situacao:   r?.situacao      || '',
    validade:   r?.validade      || r?.dataValidade || '',
    modalidade: r?.modalidade    || '',
    raw:        data,
  }
}

// ─── Dossiê ────────────────────────────────────────────────────────────────
export type DossieResult = {
  nome?: string
  dataNascimento?: string
  enderecos?: unknown[]
  telefones?: unknown[]
  emails?: unknown[]
  veiculos?: unknown[]
  imoveis?: unknown[]
  raw: unknown
}

export async function consultarDossie(cpf: string): Promise<DossieResult> {
  const data = await get('Dossie', { CPF: cpf.replace(/\D/g, ''), Token: token('DIRECTDATA_DOSSIE_TOKEN') })
  const r = data?.retorno ?? data
  return {
    nome:           r?.nome            || '',
    dataNascimento: r?.dataNascimento  || '',
    enderecos:      r?.enderecos       || [],
    telefones:      r?.telefones       || [],
    emails:         r?.emails          || [],
    veiculos:       r?.veiculos        || [],
    imoveis:        r?.imoveis         || [],
    raw:            data,
  }
}
