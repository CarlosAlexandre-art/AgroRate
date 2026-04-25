import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const doc = await prisma.propertyDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Extract storage path from public URL
  const url = new URL(doc.fileUrl)
  const storagePath = url.pathname.split('/documents/')[1]
  if (storagePath) {
    await supabase.storage.from('documents').remove([storagePath])
  }

  await prisma.propertyDocument.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const expiry = formData.get('expiry') as string | null

  const doc = await prisma.propertyDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  let fileUrl = doc.fileUrl
  let fileName = doc.fileName

  if (file) {
    // Remove old file
    const oldUrl = new URL(doc.fileUrl)
    const oldPath = oldUrl.pathname.split('/documents/')[1]
    if (oldPath) await supabase.storage.from('documents').remove([oldPath])

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${doc.propertyId}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error } = await supabase.storage.from('documents').upload(path, bytes, { contentType: file.type })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    fileUrl = publicUrl
    fileName = file.name
  }

  const updated = await prisma.propertyDocument.update({
    where: { id },
    data: {
      fileUrl,
      fileName,
      expiry: expiry ? new Date(expiry) : doc.expiry,
    },
  })
  return NextResponse.json(updated)
}
