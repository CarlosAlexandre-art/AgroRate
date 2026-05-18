import { prisma } from '@/lib/prisma'
import { TOOL_DEFINITIONS, executarTool, ToolName } from '@/lib/agent-tools'

const db = prisma as any

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NIM_URL  = 'https://integrate.api.nvidia.com/v1/chat/completions'
const MAX_STEPS = 6

type Msg = { role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }

function llmProvider() {
  if (process.env.NVIDIA_API_KEY) {
    return { url: NIM_URL, key: process.env.NVIDIA_API_KEY, model: 'meta/llama-3.3-70b-instruct' }
  }
  return { url: GROQ_URL, key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' }
}

async function callLLM(messages: Msg[], tools: typeof TOOL_DEFINITIONS): Promise<any> {
  const p = llmProvider()
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, messages, tools, tool_choice: 'auto', temperature: 0.3, max_tokens: 2048 }),
  })
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function runAgent(agentId: string, userId: string): Promise<string> {
  const agent = await db.agentConfig.findUnique({
    where: { id: agentId },
    include: { user: { include: { properties: { take: 1, select: { id: true, name: true } } } } },
  })
  if (!agent) throw new Error('Agente não encontrado')
  if (!agent.ativo) throw new Error('Agente inativo')

  const property = agent.user.properties[0]
  if (!property) throw new Error('Nenhuma propriedade encontrada')

  const run = await db.agentRun.create({ data: { agentId, userId, status: 'RUNNING' } })

  const hoje = new Date().toLocaleDateString('pt-BR')
  const systemMsg = agent.systemPrompt
    ?? `Você é ${agent.nome}, um agente especializado em ${agent.role} no AgroRate. Você trabalha para o produtor da propriedade "${property.name}". Hoje é ${hoje}. Use as ferramentas disponíveis para coletar dados reais sobre score de crédito, documentação e oportunidades financeiras. Seja objetivo e forneça recomendações concretas e acionáveis.`

  const availableTools = agent.tools.length > 0
    ? TOOL_DEFINITIONS.filter(t => agent.tools.includes(t.function.name))
    : TOOL_DEFINITIONS

  const messages: Msg[] = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: `Execute sua análise completa para a propriedade "${property.name}" e relate os pontos mais importantes sobre crédito, score e oportunidades. Crie alertas se identificar situações críticas.` },
  ]

  const toolCallLog: string[] = []
  let finalResult = ''
  let steps = 0

  try {
    while (steps < MAX_STEPS) {
      steps++
      const resp = await callLLM(messages, availableTools as any)
      const choice = resp.choices[0]
      const msg = choice.message

      messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls })

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalResult = msg.content ?? 'Análise concluída.'
        break
      }

      for (const tc of msg.tool_calls) {
        const fn = tc.function
        let args: Record<string, unknown> = {}
        try { args = JSON.parse(fn.arguments || '{}') } catch { /* ignore */ }

        const result = await executarTool(fn.name as ToolName, args, property.id)
        toolCallLog.push(`${fn.name}(${JSON.stringify(args)}) → ${result.slice(0, 200)}`)
        messages.push({ role: 'tool', content: result, tool_call_id: tc.id, name: fn.name })
      }

      if (choice.finish_reason === 'stop') {
        finalResult = msg.content ?? 'Análise concluída.'
        break
      }
    }

    if (!finalResult) finalResult = 'Agente atingiu o limite de iterações.'

    await db.agentRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        resultado: finalResult.slice(0, 4000),
        toolCalls: toolCallLog.join('\n').slice(0, 4000),
      },
    })
    return finalResult
  } catch (err: any) {
    await db.agentRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', finishedAt: new Date(), erro: err?.message ?? 'Erro desconhecido' },
    })
    throw err
  }
}
