import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function getPropertyId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: { properties: { take: 1, select: { id: true } } },
  })
  return user?.properties[0]?.id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getPropertyId(user.id)
  if (!propertyId) return NextResponse.json([])

  const docs = await prisma.propertyDocument.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const propertyId = await getPropertyId(user.id)
  if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const expiry = formData.get('expiry') as string | null
  const scoreImpact = Number(formData.get('scoreImpact') || 0)
  const required = formData.get('required') === 'true'

  if (!file || !name || !category) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${propertyId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

  const doc = await prisma.propertyDocument.create({
    data: {
      propertyId,
      name,
      category,
      fileUrl: publicUrl,
      fileName: file.name,
      expiry: expiry ? new Date(expiry) : null,
      scoreImpact,
      required,
    },
  })
  return NextResponse.json(doc, { status: 201 })
}
