'use client'
import { useRef, MouseEvent } from 'react'

interface Props {
  icon: string
  title: string
  desc: string
  color: string
  iconBg: string
  delay?: number
}

export default function FeatureCard3D({ icon, title, desc, color, iconBg, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(6px) scale(1.02)`
    el.style.boxShadow = `${-x * 12}px ${-y * 12}px 32px rgba(6,95,70,0.15)`
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)'
    el.style.boxShadow = ''
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`reveal card-3d ${color} rounded-2xl p-6 border border-white cursor-default`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4`}>{icon}</div>
      <h3 className="font-bold text-slate-900 mb-2 text-base">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}
