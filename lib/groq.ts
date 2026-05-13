const NIM_URL    = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NIM_MODEL  = 'meta/llama-3.3-70b-instruct'
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function provider() {
  if (process.env.NVIDIA_API_KEY) {
    return { url: NIM_URL, model: NIM_MODEL, key: process.env.NVIDIA_API_KEY }
  }
  return { url: GROQ_URL, model: GROQ_MODEL, key: process.env.GROQ_API_KEY }
}

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function groq(messages: Msg[], maxTokens = 1024): Promise<string> {
  const p = provider()
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, messages, temperature: 0.7, max_tokens: maxTokens }),
  })
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

export async function groqStream(messages: Msg[]): Promise<ReadableStream<Uint8Array>> {
  const p = provider()
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, messages, temperature: 0.7, max_tokens: 2048, stream: true }),
  })
  if (!res.ok) throw new Error(`LLM stream ${res.status}`)
  return res.body!
}
