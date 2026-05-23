import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 192, height: 192 }

export async function GET() {
  return new ImageResponse(
    <div style={{
      width: 192, height: 192,
      background: 'linear-gradient(155deg, #052e16 0%, #065f46 55%, #047857 100%)',
      borderRadius: 44,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Gauge track */}
      <div style={{
        position: 'relative',
        width: 108, height: 54,
        marginTop: 20,
        display: 'flex',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderTop: '13px solid rgba(255,255,255,0.13)',
          borderLeft: '13px solid rgba(255,255,255,0.13)',
          borderRight: '13px solid rgba(255,255,255,0.13)',
          borderBottom: 'none',
          borderRadius: '54px 54px 0 0',
        }} />
        {/* Active arc — direita = score alto */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 81, height: 54,
          borderTop: '13px solid #6ee7b7',
          borderRight: '13px solid #6ee7b7',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRadius: '0 54px 0 0',
        }} />
        {/* Needle */}
        <div style={{
          position: 'absolute', bottom: 0,
          left: 46, width: 8, height: 44,
          background: 'white',
          borderRadius: '4px 4px 2px 2px',
          transformOrigin: 'bottom center',
          transform: 'rotate(28deg)',
        }} />
        {/* Centro */}
        <div style={{
          position: 'absolute', bottom: -10, left: 36,
          width: 20, height: 20,
          background: 'white',
          borderRadius: '50%',
        }} />
      </div>
      {/* R$ */}
      <div style={{
        color: '#6ee7b7',
        fontSize: 30,
        fontWeight: 900,
        fontFamily: 'sans-serif',
        letterSpacing: -1,
        marginTop: 20,
      }}>R$</div>
      {/* Folha */}
      <div style={{
        color: 'rgba(110,231,183,0.5)',
        fontSize: 11,
        fontFamily: 'sans-serif',
        letterSpacing: 3,
        marginTop: 2,
        textTransform: 'uppercase',
      }}>AgroRate</div>
    </div>,
    { width: 192, height: 192 }
  )
}
