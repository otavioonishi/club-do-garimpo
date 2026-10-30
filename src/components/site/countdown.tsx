'use client'

import { useEffect, useState } from 'react'

function getTimeLeft(): { hours: string; minutes: string; seconds: string } | null {
  if (typeof window === 'undefined') return null
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const diff = Math.max(0, end.getTime() - now.getTime())
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) }
}

/**
 * Contagem regressiva até a meia-noite (fim da oferta do dia).
 * Só inicia após montar no cliente para evitar mismatch de hidratação.
 */
export default function Countdown({ compact = false }: { compact?: boolean }) {
  const [time, setTime] = useState<{ hours: string; minutes: string; seconds: string } | null>(null)

  useEffect(() => {
    const tick = () => setTime(getTimeLeft())
    // primeiro tick fora do corpo síncrono do effect (evita render em cascata)
    const first = window.setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      window.clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  const boxClass = compact
    ? 'min-w-9 rounded-md bg-white/10 px-1.5 py-0.5 text-center text-base font-black tabular-nums text-rose-50'
    : 'min-w-14 rounded-xl bg-[#3d0c1e] px-2.5 py-2 text-center text-3xl font-black tabular-nums text-rose-50 shadow-lg shadow-rose-900/20 sm:min-w-16 sm:text-4xl'

  const labelClass = compact
    ? 'sr-only'
    : 'mt-1 block text-[10px] font-bold uppercase tracking-widest text-rose-900/50'

  if (!time) {
    // Estado inicial (servidor e primeiro render do cliente)
    return (
      <span className={compact ? 'text-base font-black tabular-nums text-white' : 'text-3xl font-black tabular-nums text-[#3d0c1e] sm:text-4xl'}>
        --:--:--
      </span>
    )
  }

  return (
    <div className={compact ? 'flex items-center gap-1' : 'flex items-start gap-2 sm:gap-3'}>
      <div>
        <span className={boxClass}>{time.hours}</span>
        <span className={labelClass}>horas</span>
      </div>
      <span className={compact ? 'font-black text-white' : 'pt-1 text-2xl font-black text-rose-600 sm:text-3xl'}>:</span>
      <div>
        <span className={boxClass}>{time.minutes}</span>
        <span className={labelClass}>min</span>
      </div>
      <span className={compact ? 'font-black text-white' : 'pt-1 text-2xl font-black text-rose-600 sm:text-3xl'}>:</span>
      <div>
        <span className={`${boxClass} text-rose-300`}>{time.seconds}</span>
        <span className={labelClass}>seg</span>
      </div>
    </div>
  )
}
