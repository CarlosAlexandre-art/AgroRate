import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function analyzeTerritorial(lat: number, lng: number, declaredHa: number) {
  const rand = seededRand(Math.round((lat + lng) * 9973))
  const detectedFields = 3 + Math.floor(rand() * 8)
  const detectedHa = declaredHa * (0.75 + rand() * 0.35)
  const avgNdvi = 0.35 + rand() * 0.45
  const avgConf = 0.83 + rand() * 0.15
  const matchRatio = Math.min(1, detectedHa / (declaredHa || 1))

  // Score 0-100
  let score = 0
  score += Math.min(40, Math.round(avgNdvi * 55))             // NDVI quality: up to 40
  score += Math.min(35, Math.round(matchRatio * 40))          // Area match: up to 35
  score += Math.min(15, Math.round(avgConf * 16))             // Confidence: up to 15
  score += Math.min(10, detectedFields >= 3 ? 10 : detectedFields * 3) // Field count: up to 10

  // AgroRate bonus points (max +50)
  const bonus = Math.round((score / 100) * 50)

  const ndviLabel =
    avgNdvi >= 0.7 ? 'Excelente' :
    avgNdvi >= 0.5 ? 'Bom' :
    avgNdvi >= 0.35 ? 'Moderado' :
    avgNdvi >= 0.2 ? 'Estressado' : 'Crítico'

  const ndviColor =
    avgNdvi >= 0.7 ? '#16a34a' :
    avgNdvi >= 0.5 ? '#65a30d' :
    avgNdvi >= 0.35 ? '#ca8a04' :
    avgNdvi >= 0.2 ? '#ea580c' : '#dc2626'

  return {
    territorialScore: score,
    bonus,
    detectedFields,
    detectedHa: parseFloat(detectedHa.toFixed(1)),
    declaredHa: parseFloat(declaredHa.toFixed(1)),
    matchRatio: parseFloat(matchRatio.toFixed(2)),
    avgNdvi: parseFloat(avgNdvi.toFixed(3)),
    avgConf: parseFloat(avgConf.toFixed(3)),
    ndviLabel,
    ndviColor,
    source: 'FTW Sentinel-2 · Demo',
    hasCoords: true,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
      include: { properties: { take: 1 } },
    })

    const property = user?.properties[0]

    if (!property?.lat || !property?.lng) {
      return NextResponse.json({
        territorialScore: null,
        bonus: 0,
        hasCoords: false,
        message: 'Configure a localização da sua propriedade no SmartAgroOS para ativar a validação satelital.',
      })
    }

    const ftwApiUrl = process.env.FTW_API_URL
    if (ftwApiUrl) {
      try {
        const r = 0.05
        const bbox = `${Number(property.lng) - r},${Number(property.lat) - r},${Number(property.lng) + r},${Number(property.lat) + r}`
        const res = await fetch(`${ftwApiUrl}/v1/fields?bbox=${bbox}&limit=100`, {
          signal: AbortSignal.timeout(10000),
        })
        if (res.ok) {
          const data = await res.json()
          const features = data.features ?? []
          const detectedHa = features.reduce((s: number, f: { properties: { area_ha: number } }) => s + (f.properties?.area_ha ?? 0), 0)
          const avgNdvi = features.length
            ? features.reduce((s: number, f: { properties: { ndvi: number } }) => s + (f.properties?.ndvi ?? 0), 0) / features.length
            : 0.5
          return NextResponse.json(analyzeTerritorial(Number(property.lat), Number(property.lng), Number(property.sizeHectares ?? detectedHa)))
        }
      } catch {
        // fallthrough to demo
      }
    }

    return NextResponse.json(analyzeTerritorial(
      Number(property.lat),
      Number(property.lng),
      Number(property.sizeHectares ?? 50),
    ))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
