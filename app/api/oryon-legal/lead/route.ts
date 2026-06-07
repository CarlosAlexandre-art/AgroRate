import { NextRequest, NextResponse } from 'next/server'

const ADVOGADA_EMAIL = process.env.ORYON_LEGAL_EMAIL ?? 'contato@oryon.ag'
const RESEND_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, telefone, email, cidade, estado, objetivo, origem } = body

    if (!nome || !telefone || !objetivo) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Envia e-mail para a advogada via Resend
    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ORYON Legal <noreply@oryon.ag>',
          to: ADVOGADA_EMAIL,
          subject: `⚖️ Novo lead jurídico — ${nome} (${origem})`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#15803d;color:white;padding:24px;border-radius:12px 12px 0 0">
                <h2 style="margin:0">⚖️ Novo Lead — ORYON Legal</h2>
                <p style="margin:4px 0 0;opacity:0.8;font-size:14px">Origem: ${origem}</p>
              </div>
              <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:140px">Nome</td><td style="padding:8px 0;font-weight:600;font-size:14px">${nome}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">WhatsApp</td><td style="padding:8px 0;font-weight:600;font-size:14px"><a href="https://wa.me/55${telefone.replace(/\D/g, '')}" style="color:#15803d">${telefone}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">E-mail</td><td style="padding:8px 0;font-weight:600;font-size:14px">${email || '—'}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Cidade/Estado</td><td style="padding:8px 0;font-weight:600;font-size:14px">${cidade || '—'}${estado ? ` / ${estado}` : ''}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Objetivo</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#15803d">${objetivo}</td></tr>
                </table>
                <div style="margin-top:20px;padding:16px;background:white;border-radius:8px;border:1px solid #e5e7eb">
                  <p style="margin:0;font-size:13px;color:#6b7280">Este lead foi gerado automaticamente pelo ecossistema OryonAG. O cliente está cadastrado na plataforma e seus dados foram enriquecidos com informações operacionais.</p>
                </div>
                <a href="https://wa.me/55${telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(nome)}%2C%20sou%20da%20equipe%20ORYON%20Legal%20e%20gostaria%20de%20agendar%20um%20diagnóstico%20jurídico%20gratuito%20para%20você."
                   style="display:block;margin-top:16px;text-align:center;background:#25d366;color:white;padding:14px;border-radius:8px;text-decoration:none;font-weight:700">
                  💬 Responder via WhatsApp
                </a>
              </div>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('oryon-legal lead error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
