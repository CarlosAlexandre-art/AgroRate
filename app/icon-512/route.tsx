import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 512, height: 512 }

export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 512, height: 512,
      background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 100,
    }}>
      <div style={{
        color: 'white', fontSize: 200, fontWeight: 900,
        fontFamily: 'sans-serif', letterSpacing: -8,
      }}>AR</div>
    </div>,
    { width: 512, height: 512 }
  )
}
