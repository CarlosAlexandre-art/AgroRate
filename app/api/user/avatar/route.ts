import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande. Máximo 5MB.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    // Remove avatar anterior se existir
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { avatarUrl: true } })
    if (dbUser?.avatarUrl) {
      try {
        const oldUrl = new URL(dbUser.avatarUrl)
        const oldPath = oldUrl.pathname.split('/avatares/')[1]
        if (oldPath) await admin.storage.from('avatares').remove([oldPath])
      } catch { /* ignora se URL inválida */ }
    }

    const { error: uploadError } = await admin.storage
      .from('avatares')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from('avatares').getPublicUrl(path)

    await prisma.user.update({ where: { supabaseId: user.id }, data: { avatarUrl: publicUrl } })
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (error) {
    console.error('Erro ao salvar avatar:', error)
    return NextResponse.json({ error: 'Erro interno ao salvar foto' }, { status: 500 })
  }
}
