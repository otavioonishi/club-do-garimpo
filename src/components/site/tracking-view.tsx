'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Banknote,
  ClipboardList,
  Home,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  TreePine,
  Truck,
} from 'lucide-react'
import SupportButton from '@/components/site/support-button'

/* ---------------- tipos ---------------- */

type TrackOrder = {
  code: string
  status: string
  quantity: number
  lightsKit: boolean
  totalValue: number
  customerFirstName: string
  city: string
  state: string
  deliveryDays: number | null
  deliveryNote: string | null
  shippedAt: string | null
  deliveredAt: string | null
  paidAt: string | null
  createdAt: string
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** data estimada de chegada = envio + prazo (em dias) */
function etaDate(shippedAt: string, days: number): string {
  const d = new Date(new Date(shippedAt).getTime() + days * 86400000)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DONE_STATES = ['pago', 'enviado', 'entregue']

export default function TrackingView({ code }: { code: string }) {
  const [order, setOrder] = useState<TrackOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(code)}`, { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 404) setNotFound(true)
        return
      }
      const json = await res.json()
      setOrder(json.order)
      setNotFound(false)
    } catch {
      // falha momentânea — mantém o que já está na tela
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    load()
    const t = setInterval(load, 20000) // atualiza sozinho a cada 20 segundos
    return () => clearInterval(t)
  }, [load])

  /* ---------- pedido não existe ---------- */
  if (notFound) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FBF7F2] px-4 text-center text-rose-950">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 ring-2 ring-rose-200">
          <Package className="h-10 w-10 text-rose-400" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-black">Pedido não encontrado</h1>
        <p className="mt-2 max-w-xs text-base leading-relaxed text-stone-600">
          Confira o código do pedido — ele aparece na tela depois da compra (começa com CG-).
        </p>
        <Link
          href="/"
          className="mt-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700"
        >
          Voltar para a loja
        </Link>
        <SupportButton />
      </main>
    )
  }

  /* ---------- carregando ---------- */
  if (loading || !order) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FBF7F2] text-rose-950">
        <Loader2 className="h-10 w-10 animate-spin text-rose-400" aria-hidden="true" />
        <p className="mt-3 text-base font-bold text-stone-500">Carregando seu pedido…</p>
      </main>
    )
  }

  const paid = order.paidAt !== null || DONE_STATES.includes(order.status)
  const shipped = order.status === 'enviado' || order.status === 'entregue'
  const delivered = order.status === 'entregue'

  /* ---------- mensagens por status ---------- */
  let heroIcon: React.ComponentType<{ className?: string }> = Banknote
  let heroTitle = ''
  let heroText = ''
  if (delivered) {
    heroIcon = TreePine
    heroTitle = 'Entregue! 🎄'
    heroText = `Sua árvore chegou, ${order.customerFirstName}! Bom proveito e Feliz Natal! Se precisar de qualquer coisa, nosso suporte está aqui.`
  } else if (shipped) {
    heroIcon = Truck
    heroTitle = 'Sua árvore está a caminho! 🚚'
    heroText = `Boa notícia, ${order.customerFirstName}! Seu pedido saiu para entrega em ${order.city}/${order.state}. Acompanhe o prazo aqui — esta página atualiza sozinha.`
  } else if (paid) {
    heroIcon = Sparkles
    heroTitle = 'Pagamento confirmado! 🎉'
    heroText = 'Recebemos seu Pix e sua árvore já está sendo preparada com carinho. Quando sair para entrega, o status atualiza aqui nesta página.'
  } else {
    heroIcon = Banknote
    heroTitle = 'Aguardando o Pix…'
    heroText = 'Assim que o pagamento cair, começamos a preparar sua árvore. Esta página atualiza sozinha — pode voltar aqui quando quiser!'
  }

  /* ---------- linha do tempo ---------- */
  type Step = {
    icon: React.ComponentType<{ className?: string }>
    label: string
    date?: string
    state: 'done' | 'current' | 'pending'
  }

  const steps: Step[] = [
    {
      icon: ClipboardList,
      label: 'Pedido recebido',
      date: fmtDate(order.createdAt),
      state: 'done',
    },
    {
      icon: Banknote,
      label: paid ? 'Pagamento confirmado' : 'Aguardando pagamento do Pix',
      date: order.paidAt ? fmtDate(order.paidAt) : undefined,
      state: paid ? 'done' : 'current',
    },
    {
      icon: Truck,
      label: delivered ? 'Entrega concluída' : shipped ? 'A caminho da sua casa' : paid ? 'Preparando seu pedido' : 'Aguardando pagamento',
      date: order.shippedAt ? fmtDate(order.shippedAt) : undefined,
      state: shipped ? 'done' : paid ? 'current' : 'pending',
    },
    {
      icon: Home,
      label: 'Entregue',
      date: order.deliveredAt ? fmtDate(order.deliveredAt) : undefined,
      state: delivered ? 'done' : shipped ? 'current' : 'pending',
    },
  ]

  const iconCls = {
    done: 'bg-[#25D366] text-white ring-[#25D366]/30',
    current: 'bg-amber-400 text-rose-950 ring-amber-400/30 animate-pulse',
    pending: 'bg-stone-200 text-stone-400 ring-stone-200',
  }

  return (
    <main className="min-h-[100dvh] bg-[#FBF7F2] px-4 pb-28 pt-6 text-rose-950">
      <div className="mx-auto w-full max-w-md">
        {/* ---------- topo ---------- */}
        <p className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-rose-700">
          <TreePine className="h-5 w-5" aria-hidden="true" /> Club do Garimpo
        </p>
        <h1 className="mt-1 text-center font-display text-3xl font-black">Acompanhar pedido</h1>

        {/* ---------- destaque do status ---------- */}
        <section className="mt-5 overflow-hidden rounded-3xl border-2 border-rose-200 bg-white shadow-md shadow-rose-900/5">
          <div className="bg-gradient-to-r from-rose-700 to-rose-900 px-5 py-4 text-center text-white">
            <p className="text-xs font-black uppercase tracking-widest text-rose-200">
              Pedido {order.code}
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 font-display text-2xl font-black">
              {(() => {
                const Icon = heroIcon
                return <Icon className="h-7 w-7 shrink-0" aria-hidden="true" />
              })()}
              {heroTitle}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-center text-base leading-relaxed text-stone-600">{heroText}</p>

            {/* 🚚 prazo de entrega definido pelo painel */}
            {shipped && order.deliveryDays !== null && !delivered && (
              <p className="mt-4 flex flex-col items-center gap-0.5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3.5 text-center">
                <span className="flex items-center gap-2 text-lg font-black text-amber-900">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                  Chega em até {order.deliveryDays} {order.deliveryDays === 1 ? 'dia' : 'dias'}
                </span>
                {order.shippedAt && (
                  <span className="text-base font-bold text-amber-800">
                    até {etaDate(order.shippedAt, order.deliveryDays)}
                  </span>
                )}
                {order.deliveryNote && (
                  <span className="mt-1 text-sm font-semibold text-amber-700">
                    {order.deliveryNote}
                  </span>
                )}
              </p>
            )}
          </div>
        </section>

        {/* ---------- linha do tempo ---------- */}
        <section className="mt-5 rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-md shadow-rose-900/5">
          <h2 className="text-base font-black uppercase tracking-wide text-stone-500">
            Andamento do pedido
          </h2>
          <ol className="mt-4 space-y-0">
            {steps.map((s, i) => (
              <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[1.375rem] top-11 h-[calc(100%-2.75rem)] w-1 rounded-full ${
                      s.state === 'done' ? 'bg-[#25D366]/60' : 'bg-stone-200'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 ${iconCls[s.state]}`}
                >
                  {(() => {
                    const Icon = s.icon
                    return <Icon className="h-5 w-5" aria-hidden="true" />
                  })()}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p
                    className={`text-base font-black leading-snug ${
                      s.state === 'pending' ? 'text-stone-400' : 'text-rose-950'
                    }`}
                  >
                    {s.label}
                  </p>
                  {s.date && (
                    <p className="mt-0.5 text-sm font-bold text-stone-500">{s.date}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- resumo do pedido ---------- */}
        <section className="mt-5 rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-md shadow-rose-900/5">
          <p className="flex items-center justify-between text-base font-bold text-stone-600">
            <span>Árvore 2m + kit 54 enfeites</span>
            <span>×{order.quantity}</span>
          </p>
          {order.lightsKit && (
            <p className="mt-2 flex items-center gap-1.5 text-base font-bold text-[#1d7a3f]">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" /> Kit Luzinhas incluído
            </p>
          )}
          <p className="mt-3 flex items-center justify-between border-t-2 border-rose-100 pt-3 text-xl font-black">
            <span>Total pago</span>
            <span className="text-rose-700">{brl(order.totalValue)}</span>
          </p>
        </section>

        {/* ---------- atualização + ações ---------- */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={load}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-rose-200 bg-white px-5 py-2.5 text-base font-black uppercase tracking-wide text-rose-700 transition hover:border-rose-400"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Atualizar agora
          </button>
          <p className="text-sm font-semibold text-stone-400">
            Esta página atualiza sozinha a cada 20 segundos
          </p>
          <Link
            href="/"
            className="text-base font-bold text-rose-700 underline underline-offset-4 transition hover:text-rose-900"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>

      <SupportButton />
    </main>
  )
}
