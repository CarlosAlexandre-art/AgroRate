import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 192, height: 192 }

export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 192, height: 192,
      background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 40,
    }}>
      <div style={{
        color: 'white', fontSize: 80, fontWeight: 900,
        fontFamily: 'sans-serif', letterSpacing: -4,
      }}>AR</div>
    </div>,
    { width: 192, height: 192 }
  )
}
