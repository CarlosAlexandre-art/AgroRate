'use client'

import { useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────────
   3 variantes — sorteadas sem repetir (sessionStorage)

   A · Colheita Dourada — âmbar/ouro, sensação de riqueza rural
   B · Crédito Verde    — esmeralda profundo, confiança financeira
   C · Crepúsculo Safra — índigo/violeta + verde, sofisticação fintech
───────────────────────────────────────────── */
const VARIANTS = [
  {
    id: 'a',
    bg: '#03070a',
    beamColor: 'rgba(251,191,36,.26)',
    beamEcho: 'rgba(251,191,36,.10)',
    starHue: ['180,130,20', '251,191,36'],
    glowColor: 'rgba(217,119,6,.90)',
    glowFar: 'rgba(251,191,36,.30)',
    wordGrad: 'linear-gradient(140deg,#fefce8 0%,#fde68a 45%,#f59e0b 100%)',
    tagColor: 'rgba(251,191,36,.60)',
    subColor: 'rgba(217,119,6,.50)',
    dotColor: 'rgba(217,119,6,.40)',
    gaugeTrack: '#78350f',
    gaugeArc: '#f59e0b',
    gaugeNeedle: '#fde68a',
    leafStroke: '#d97706',
    leafFill: 'rgba(217,119,6,.15)',
    starStroke: '#fbbf24',
  },
  {
    id: 'b',
    bg: '#000',
    beamColor: 'rgba(52,211,153,.24)',
    beamEcho: 'rgba(52,211,153,.08)',
    starHue: ['16,185,129', '52,211,153'],
    glowColor: 'rgba(16,185,129,.90)',
    glowFar: 'rgba(52,211,153,.30)',
    wordGrad: 'linear-gradient(140deg,#f0fdf4 0%,#6ee7b7 50%,#10b981 100%)',
    tagColor: 'rgba(52,211,153,.60)',
    subColor: 'rgba(16,185,129,.50)',
    dotColor: 'rgba(16,185,129,.38)',
    gaugeTrack: '#064e3b',
    gaugeArc: '#10b981',
    gaugeNeedle: '#6ee7b7',
    leafStroke: '#34d399',
    leafFill: 'rgba(16,185,129,.15)',
    starStroke: '#34d399',
  },
  {
    id: 'c',
    bg: '#030410',
    beamColor: 'rgba(167,139,250,.22)',
    beamEcho: 'rgba(167,139,250,.08)',
    starHue: ['99,102,241', '167,139,250'],
    glowColor: 'rgba(99,102,241,.85)',
    glowFar: 'rgba(52,211,153,.28)',
    wordGrad: 'linear-gradient(140deg,#faf5ff 0%,#c4b5fd 45%,#34d399 100%)',
    tagColor: 'rgba(167,139,250,.58)',
    subColor: 'rgba(99,102,241,.50)',
    dotColor: 'rgba(99,102,241,.40)',
    gaugeTrack: '#1e1b4b',
    gaugeArc: '#818cf8',
    gaugeNeedle: '#c4b5fd',
    leafStroke: '#34d399',
    leafFill: 'rgba(99,102,241,.15)',
    starStroke: '#a78bfa',
  },
]

function buildCSS(v: typeof VARIANTS[0]) {
  return `
#agr-splash{
  position:fixed;inset:0;z-index:99999;
  background:${v.bg};
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
  padding-top:env(safe-area-inset-top);
  padding-bottom:env(safe-area-inset-bottom);
}
#agr-splash.sp-exit{animation:agrOut .9s ease-in-out forwards}
#agr-splash.sp-gone{display:none!important}
@keyframes agrOut{to{opacity:0}}

#agr-stars{position:absolute;inset:0;pointer-events:none}

.agr-beam{position:absolute;inset-block:0;pointer-events:none}
#agr-beam-a{
  width:48%;left:-48%;
  background:linear-gradient(90deg,transparent 0%,${v.beamColor.replace('.26',',.05')} 20%,${v.beamColor} 50%,${v.beamColor.replace('.26',',.05')} 80%,transparent 100%);
}
#agr-beam-a.run{animation:agrBeamA 1.3s cubic-bezier(.4,0,.3,1) forwards}
#agr-beam-b{
  width:22%;left:-22%;
  background:linear-gradient(90deg,transparent,${v.beamEcho} 50%,transparent);
}
#agr-beam-b.run{animation:agrBeamB 1.1s cubic-bezier(.4,0,.3,1) forwards}
@keyframes agrBeamA{to{left:160%}}
@keyframes agrBeamB{to{left:160%}}

#agr-logo{
  width:clamp(100px,20vmin,148px);
  height:clamp(100px,20vmin,148px);
  opacity:0;
  filter:drop-shadow(0 0 28px ${v.glowColor}) drop-shadow(0 0 60px ${v.glowFar});
}
#agr-logo.in{animation:agrLogoIn .95s cubic-bezier(.2,0,.1,1) forwards}
@keyframes agrLogoIn{
  0%  {opacity:0;transform:scale(.65)}
  55% {opacity:1;transform:scale(1.06)}
  100%{opacity:1;transform:scale(1);filter:drop-shadow(0 0 28px ${v.glowColor}) drop-shadow(0 0 60px ${v.glowFar})}
}

/* gauge arc draw */
.agr-arc{stroke-dasharray:166;stroke-dashoffset:166;transition:stroke-dashoffset 1.1s ease-out}
.agr-arc.in{stroke-dashoffset:0}
/* gauge track always visible */
/* needle swing */
.agr-needle{transform-origin:24px 24px;transform:rotate(-95deg);opacity:0;transition:transform 1.0s cubic-bezier(.34,1.56,.64,1),opacity .3s ease-out}
.agr-needle.in{transform:rotate(18deg);opacity:1}
/* leaf reveal */
.agr-leaf{clip-path:inset(100% 0 0 0);transition:clip-path .7s ease-out .2s}
.agr-leaf.in{clip-path:inset(0% 0 0 0)}
/* score stars pop */
.agr-star{transform:scale(0);opacity:0;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .2s ease-out}
.agr-star.in{transform:scale(1);opacity:1}
.agr-star:nth-child(1){transition-delay:.0s}
.agr-star:nth-child(2){transition-delay:.08s}
.agr-star:nth-child(3){transition-delay:.16s}
.agr-star:nth-child(4){transition-delay:.24s}
.agr-star:nth-child(5){transition-delay:.32s}

#agr-word{
  font-family:'Montserrat',system-ui,sans-serif;
  font-size:clamp(2.4rem,9vmin,4.4rem);font-weight:900;line-height:1;
  background:${v.wordGrad};
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  margin-top:clamp(14px,4vmin,26px);
  opacity:0;letter-spacing:-.01em;
}
#agr-word.in{animation:agrWordIn .75s ease-out forwards}
@keyframes agrWordIn{
  from{opacity:0;transform:translateY(14px)}
  to  {opacity:1;transform:translateY(0)}
}

#agr-tag{
  font-family:'Montserrat',system-ui,sans-serif;
  font-size:clamp(.55rem,2vmin,.72rem);letter-spacing:.18em;text-transform:uppercase;
  color:${v.tagColor};margin-top:10px;text-align:center;padding:0 20px;
  opacity:0;
}
#agr-tag.in{animation:agrFadeUp .6s ease-out forwards}

#agr-sub{
  font-family:'Montserrat',system-ui,sans-serif;
  font-size:clamp(.5rem,1.6vmin,.62rem);letter-spacing:.1em;text-transform:uppercase;
  color:${v.subColor};margin-top:clamp(14px,4vmin,22px);
  display:flex;flex-wrap:wrap;gap:clamp(8px,3vmin,18px);justify-content:center;
  padding:0 16px;opacity:0;
}
#agr-sub.in{animation:agrFadeUp .55s ease-out forwards}
@keyframes agrFadeUp{
  from{opacity:0;transform:translateY(6px)}
  to  {opacity:1;transform:translateY(0)}
}
.agr-dot{
  display:inline-block;width:3px;height:3px;border-radius:50%;
  background:${v.dotColor};margin-right:5px;vertical-align:middle;
}
`
}

function addCls(id: string, c: string) {
  document.getElementById(id)?.classList.add(c)
}
function addClsAll(q: string, c: string) {
  document.querySelectorAll(q).forEach(el => el.classList.add(c))
}

export default function SplashScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gone, setGone] = useState(false)
  const [variant] = useState(() => {
    try {
      const last = sessionStorage.getItem('agr_splash_last') ?? ''
      const pool = VARIANTS.filter(v => v.id !== last)
      const pick = pool[Math.floor(Math.random() * pool.length)]
      sessionStorage.setItem('agr_splash_last', pick.id)
      return pick
    } catch {
      return VARIANTS[0]
    }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.5 + 0.3,
      dl: Math.random() * 1.8, a: 0,
      hue: variant.starHue[Math.random() > 0.55 ? 0 : 1],
    }))

    let t0: number | null = null
    function draw(ts: number) {
      if (!t0) t0 = ts
      const e = (ts - t0) / 1000
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      stars.forEach(s => {
        if (e > s.dl) {
          s.a = Math.min(1, (e - s.dl) * 2.2)
          const p = (Math.sin((e - s.dl) * 2.4 + s.x * 10) + 1) / 2
          ctx.beginPath()
          ctx.arc(s.x * canvas!.width, s.y * canvas!.height, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${s.hue},${s.a * (0.15 + p * 0.35)})`
          ctx.fill()
        }
      })
      if (e < 6) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const T = [
      setTimeout(() => addCls('agr-logo', 'in'), 600),
      setTimeout(() => addClsAll('.agr-arc', 'in'), 700),
      setTimeout(() => addClsAll('.agr-leaf', 'in'), 850),
      setTimeout(() => addCls('agr-needle', 'in'), 1000),
      setTimeout(() => addClsAll('.agr-star', 'in'), 1100),
      setTimeout(() => addCls('agr-beam-a', 'run'), 1500),
      setTimeout(() => addCls('agr-beam-b', 'run'), 1860),
      setTimeout(() => addCls('agr-word', 'in'), 1780),
      setTimeout(() => addCls('agr-tag', 'in'), 2500),
      setTimeout(() => addCls('agr-sub', 'in'), 3060),
      setTimeout(() => {
        addCls('agr-splash', 'sp-exit')
        setTimeout(() => setGone(true), 950)
      }, 4200),
    ]

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      T.forEach(clearTimeout)
    }
  }, [variant])

  if (gone) return null

  const v = variant

  /* Gauge arc: semicircle de -120° a +120° (240°) = comprimento ~166px para r=20 */
  const cx = 24, cy = 24, r = 18
  const startAngle = -120 * (Math.PI / 180)
  const endAngle = 120 * (Math.PI / 180)
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
  const arcD = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 1,1 ${x2.toFixed(2)},${y2.toFixed(2)}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buildCSS(v) }} />
      <div id="agr-splash">
        <canvas id="agr-stars" ref={canvasRef} />
        <div id="agr-beam-a" className="agr-beam" />
        <div id="agr-beam-b" className="agr-beam" />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Logo SVG — gauge de score + folha agrícola */}
          <svg id="agr-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Trilha do gauge (static) */}
            <path
              d={arcD}
              stroke={v.gaugeTrack}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Arco animado do gauge */}
            <path
              className="agr-arc"
              d={arcD}
              stroke={v.gaugeArc}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Folha no canto inferior esquerdo */}
            <path
              className="agr-leaf"
              d="M10 38 C10 28 16 22 20 20 C18 25 15 30 15 35 C15 38 12 41 10 41 Z"
              fill={v.leafFill}
              stroke={v.leafStroke}
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Agulha do gauge */}
            <line
              id="agr-needle"
              x1="24" y1="24"
              x2="24" y2="9"
              stroke={v.gaugeNeedle}
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Ponto central */}
            <circle cx="24" cy="24" r="2.2" fill={v.gaugeNeedle} />

            {/* 5 estrelas de score — fila inferior */}
            {[0, 1, 2, 3, 4].map(i => {
              const sx = 8 + i * 8, sy = 42
              return (
                <path
                  key={i}
                  className="agr-star"
                  d={`M${sx} ${sy - 3} l.9 1.9 2 .3-1.5 1.4.4 2L${sx} ${sy + 1}l-1.8.9.4-2L${sx - 1.5} ${sy - .4}l2-.3z`}
                  fill={v.starStroke}
                  style={{ transformOrigin: `${sx}px ${sy}px` }}
                />
              )
            })}
          </svg>

          <div id="agr-word">AgroRate</div>
          <div id="agr-tag">Crédito Rural Baseado na Sua Produção</div>

          <div id="agr-sub">
            <span><span className="agr-dot" />Score Rural</span>
            <span><span className="agr-dot" />Crédito Rápido</span>
            <span><span className="agr-dot" />Histórico de Safras</span>
            <span><span className="agr-dot" />Garantia Agrícola</span>
          </div>
        </div>
      </div>
    </>
  )
}
