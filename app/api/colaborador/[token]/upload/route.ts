import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const share = await prisma.propertyShare.findUnique({
      where: { inviteToken: token },
      select: { status: true, propertyId: true, role: true, nome: true, email: true },
    })

    if (!share || share.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Acesso inválido' }, { status: 403 })
    }
    if (share.role === 'VISUALIZADOR') {
      return NextResponse.json({ error: 'Visualizadores não podem fazer upload' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const descricao = (formData.get('descricao') as string) || 'Arquivo do contador'

    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20 MB.' }, { status: 400 })

    const admin = createAdminClient()
    await admin.storage.createBucket('documents', { public: true }).catch(() => null)

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${share.propertyId}/colaborador/${Date.now()}.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = admin.storage.from('documents').getPublicUrl(path)

    const doc = await prisma.propertyDocument.create({
      data: {
        propertyId: share.propertyId,
        name: descricao,
        category: 'CONTADOR_UPLOAD',
        fileUrl: publicUrl,
        fileName: file.name,
        scoreImpact: 0,
        required: false,
      },
    })

    return NextResponse.json({ ok: true, doc }, { status: 201 })
  } catch (e) {
    console.error('[colaborador/upload] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
