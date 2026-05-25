import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) return NextResponse.redirect(`${origin}${next}`)

  const cookieStore = await cookies()
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

  // Sincronizar conta: se usuário existe no Supabase mas não no banco pelo supabaseId,
  // verificar se há um registro com o mesmo email e vincular (caso de Google OAuth vs email/senha)
  if (user?.id && user?.email) {
    try {
      const existingById = await prisma.user.findUnique({ where: { supabaseId: user.id } })
      if (!existingById) {
        const existingByEmail = await prisma.user.findUnique({ where: { email: user.email } })
        if (existingByEmail) {
          // Vincular: atualizar supabaseId para o UUID atual do Google OAuth
          await prisma.user.update({
            where: { email: user.email },
            data: { supabaseId: user.id },
          })
        } else {
          // Novo usuário AgroRate sem conta SmartAgroOS — criar registro mínimo
          await prisma.user.create({
            data: {
              supabaseId: user.id,
              name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
              email: user.email,
            },
          })
        }
      }
    } catch {
      // Não bloquear o login se a sincronização falhar
    }
  }

  return response
}
