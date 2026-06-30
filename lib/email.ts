import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendEmailConfirmation(name: string, email: string, confirmationUrl: string) {
  const resend = getResend()
  const firstName = name.split(' ')[0]
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'AgroRate <noreply@oryonag.com.br>',
    to: email,
    subject: 'Confirme seu e-mail para acessar o AgroRate',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #d1fae5;overflow:hidden;box-shadow:0 4px 24px rgba(6,95,70,0.08);">

            <div style="background:linear-gradient(135deg,#065f46,#047857,#0f766e);padding:36px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">📊</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">AgroRate</h1>
              <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;">Score de Crédito Rural</p>
            </div>

            <div style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;color:#064e3b;font-size:20px;font-weight:700;">Olá, ${firstName}! 👋</h2>
              <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;">
                Obrigado por criar sua conta no AgroRate. Para ativar o acesso e calcular seu score de crédito rural, confirme seu endereço de e-mail clicando no botão abaixo.
              </p>
              <p style="margin:0 0 28px;color:#94a3b8;font-size:13px;">
                Este link expira em 24 horas.
              </p>

              <div style="text-align:center;margin-bottom:28px;">
                <a href="${confirmationUrl}"
                   style="display:inline-block;background:#065f46;color:#ffffff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.2px;">
                  ✅ Confirmar meu e-mail
                </a>
              </div>

              <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600;">Após confirmar, você poderá:</p>
                <ul style="margin:0;padding:0 0 0 18px;color:#047857;font-size:13px;line-height:2;">
                  <li>Calcular seu AgroRate Score de crédito</li>
                  <li>Analisar documentos e certidões</li>
                  <li>Acessar proposta de crédito rural</li>
                  <li>Usar a IA financeira especializada</li>
                </ul>
              </div>

              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">
                Se você não criou esta conta, ignore este e-mail.<br/>
                O botão não funcionou? Copie e cole este link no navegador:<br/>
                <span style="color:#475569;word-break:break-all;">${confirmationUrl}</span>
              </p>
            </div>

            <div style="background:#f0fdf4;border-top:1px solid #d1fae5;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 AgroRate · OryonAG Ecosystem</p>
            </div>

          </div>
        </body>
      </html>
    `,
  })
}
