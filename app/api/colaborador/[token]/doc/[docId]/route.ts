import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

function extractStoragePath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl)
    const match = url.pathname.match(/\/documents\/(.+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; docId: string }> },
) {
  try {
    const { token, docId } = await params

    const share = await prisma.propertyShare.findUnique({
      where: { inviteToken: token },
      select: { status: true, propertyId: true },
    })

    if (!share || share.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Acesso inválido' }, { status: 403 })
    }

    const doc = await prisma.propertyDocument.findUnique({
      where: { id: docId },
      select: { fileUrl: true, fileName: true, propertyId: true },
    })

    if (!doc || doc.propertyId !== share.propertyId) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    const admin = createAdminClient()

    // Tenta signed URL primeiro (bucket privado ou público)
    const storagePath = extractStoragePath(doc.fileUrl)
    if (storagePath) {
      const { data, error } = await admin.storage
        .from('documents')
        .createSignedUrl(storagePath, 300)

      if (!error && data?.signedUrl) {
        return NextResponse.redirect(data.signedUrl)
      }
    }

    // Fallback: redireciona para a URL original
    return NextResponse.redirect(doc.fileUrl)
  } catch (e) {
    console.error('[colaborador/doc] erro:', e)
    return NextResponse.json({ error: 'Erro ao acessar documento' }, { status: 500 })
  }
}
