import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 512, height: 512 }

export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 512, height: 512,
      background: 'linear-gradient(155deg, #052e16 0%, #065f46 55%, #047857 100%)',
      borderRadius: 116,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Gauge track */}
      <div style={{
        position: 'relative',
        width: 290, height: 145,
        marginTop: 50,
        display: 'flex',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderTop: '34px solid rgba(255,255,255,0.13)',
          borderLeft: '34px solid rgba(255,255,255,0.13)',
          borderRight: '34px solid rgba(255,255,255,0.13)',
          borderBottom: 'none',
          borderRadius: '145px 145px 0 0',
        }} />
        {/* Active arc */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 218, height: 145,
          borderTop: '34px solid #6ee7b7',
          borderRight: '34px solid #6ee7b7',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRadius: '0 145px 0 0',
        }} />
        {/* Needle */}
        <div style={{
          position: 'absolute', bottom: 0,
          left: 123, width: 20, height: 118,
          background: 'white',
          borderRadius: '10px 10px 5px 5px',
          transformOrigin: 'bottom center',
          transform: 'rotate(28deg)',
        }} />
        {/* Centro */}
        <div style={{
          position: 'absolute', bottom: -26, left: 97,
          width: 52, height: 52,
          background: 'white',
          borderRadius: '50%',
        }} />
      </div>
      {/* R$ */}
      <div style={{
        color: '#6ee7b7',
        fontSize: 80,
        fontWeight: 900,
        fontFamily: 'sans-serif',
        letterSpacing: -3,
        marginTop: 54,
      }}>R$</div>
      {/* Nome */}
      <div style={{
        color: 'rgba(110,231,183,0.5)',
        fontSize: 28,
        fontFamily: 'sans-serif',
        letterSpacing: 8,
        marginTop: 6,
        textTransform: 'uppercase',
      }}>AgroRate</div>
    </div>,
    { width: 512, height: 512 }
  )
}
