import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const doc = await prisma.propertyDocument.findUnique({
    where: { id },
    include: { property: { select: { userId: true } } },
  })
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser || doc.property.userId !== dbUser.id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Extract storage path from the stored URL
  const storagePath = extractStoragePath(doc.fileUrl)
  if (!storagePath) return NextResponse.json({ error: 'Caminho do arquivo inválido' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('documents')
    .createSignedUrl(storagePath, 300) // 5 min expiry

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

function extractStoragePath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl)
    // Supabase storage URLs: /storage/v1/object/public/documents/<path>
    //                     or /storage/v1/object/sign/documents/<path>
    const match = url.pathname.match(/\/documents\/(.+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
