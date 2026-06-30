const BASE_URL = (process.env.CIQUANTA_BASE_URL ?? 'https://secties.pb.gov.br').replace(/\/$/, '')
const API_KEY  = process.env.CIQUANTA_API_KEY ?? ''
const BACKEND  = process.env.CIQUANTA_BACKEND  ?? 'Jiuyuan'

export interface QuantumJobResult {
  jobId: string
  status: 'COMPLETED' | 'RUNNING' | 'FAILED'
  counts?: Record<string, number>
  bestState?: string
  energy?: number
}

export async function runQuantumCircuit(qasm: string, shots = 1024): Promise<QuantumJobResult> {
  if (!API_KEY) throw new Error('CIQUANTA_API_KEY não configurada')

  const submitRes = await fetch(`${BASE_URL}/api/v1/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ backend: BACKEND, code: qasm, shots }),
  })

  if (!submitRes.ok) {
    const txt = await submitRes.text()
    throw new Error(`CIQuanta submit falhou ${submitRes.status}: ${txt}`)
  }

  const { job_id: jobId } = await submitRes.json()

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const pollRes = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    })
    if (!pollRes.ok) continue
    const data = await pollRes.json()
    if (data.status === 'COMPLETED') {
      const counts: Record<string, number> = data.result?.counts ?? {}
      const bestState = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0000'
      return { jobId, status: 'COMPLETED', counts, bestState }
    }
    if (data.status === 'FAILED') return { jobId, status: 'FAILED' }
  }

  return { jobId, status: 'RUNNING' }
}

// Resolve problema QUBO de otimização de score de crédito via CIQuanta.
// Uso típico: Q encoda correlações entre fatores de risco para encontrar
// a combinação de pesos que minimiza o erro de precificação de risco.
export async function solveQUBOWithCIQuanta(
  Q: number[][],
  label = 'agrorate-qubo'
): Promise<{ solution: number[]; energy: number; jobId: string }> {
  const n = Q.length
  if (n > 20) throw new Error('CIQuanta suporta até 20 qubits para QUBO direto')

  const qasm = buildQAOACircuit(Q, n)
  const result = await runQuantumCircuit(qasm, 2048)

  if (result.status !== 'COMPLETED' || !result.bestState) {
    throw new Error(`CIQuanta job ${result.jobId} não completou`)
  }

  const solution = result.bestState.split('').reverse().map(Number)

  let energy = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      energy += Q[i][j] * solution[i] * solution[j]
    }
  }

  return { solution, energy, jobId: result.jobId }
}

function buildQAOACircuit(Q: number[][], n: number): string {
  const lines: string[] = [
    'OPENQASM 2.0;',
    'include "qelib1.inc";',
    `qreg q[${n}];`,
    `creg c[${n}];`,
    '',
    '// Hadamard — superposição inicial',
  ]

  for (let i = 0; i < n; i++) lines.push(`h q[${i}];`)

  lines.push('', '// Unitário de custo QUBO (gamma=0.5)')
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(Q[i][j]) > 1e-9) {
        const angle = (Q[i][j] * 0.5).toFixed(4)
        lines.push(`cx q[${i}], q[${j}];`)
        lines.push(`rz(${angle}) q[${j}];`)
        lines.push(`cx q[${i}], q[${j}];`)
      }
    }
  }

  lines.push('', '// Mixer (beta=0.5)')
  for (let i = 0; i < n; i++) lines.push(`rx(1.0) q[${i}];`)

  lines.push('', '// Medição')
  for (let i = 0; i < n; i++) lines.push(`measure q[${i}] -> c[${i}];`)

  return lines.join('\n')
}
