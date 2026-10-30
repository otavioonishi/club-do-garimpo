'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Clipboard,
  Copy,
  Lock,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  RefreshCw,
  Store,
  TreePine,
  Truck,
  X,
} from 'lucide-react'
import { SITE_CONFIG } from '@/config'

/* ---------------- tipos ---------------- */

type Order = {
  id: string
  code: string
  customerName: string
  cpf: string | null
  phone: string
  cep: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  quantity: number
  lightsKit: boolean
  totalValue: number
  status: string
  createdAt: string
  paidAt: string | null
}

const NEXT_ACTION: Record<string, { next: string; label: string; icon: React.ComponentType<{ className?: string }> } | null> = {
  novo: { next: 'pago', label: 'Marcar Pix pago', icon: Check },
  aguardando_pagamento: { next: 'pago', label: 'Marcar Pix pago', icon: Check },
  pago: { next: 'enviado', label: 'Marcar como enviado', icon: Truck },
  enviado: null,
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo (WhatsApp)',
  aguardando_pagamento: 'Aguardando Pix',
  pago: 'Pix pago',
  enviado: 'Enviado',
}

const STATUS_CLS: Record<string, string> = {
  novo: 'border-stone-400/40 bg-white/10 text-rose-100/90',
  aguardando_pagamento: 'border-amber-400/60 bg-amber-400/15 text-amber-400',
  pago: 'border-[#25D366]/60 bg-[#25D366]/15 text-[#25D366]',
  enviado: 'border-stone-400/40 bg-stone-400/15 text-rose-100/80',
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '')
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ---------------- porta de entrada: #pedidos + e-mail + senha ---------------- */

export default function AdminGate() {
  const [visible, setVisible] = useState(false)
  const [auth, setAuth] = useState<{ email: string; pin: string } | null>(null)

  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#pedidos') {
        setVisible(true)
        const email = sessionStorage.getItem('admin-email')
        const pin = sessionStorage.getItem('admin-pin')
        if (email && pin) setAuth({ email, pin })
      } else {
        setVisible(false)
      }
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  if (!visible) return null

  const authorized =
    auth !== null &&
    auth.email.toLowerCase() === SITE_CONFIG.adminEmail.toLowerCase() &&
    auth.pin === SITE_CONFIG.adminPin

  if (authorized) {
    return (
      <AdminPanel
        onLogout={() => {
          sessionStorage.removeItem('admin-email')
          sessionStorage.removeItem('admin-pin')
          setAuth(null)
        }}
      />
    )
  }

  return (
    <LoginScreen
      onOk={(email, pin) => {
        sessionStorage.setItem('admin-email', email)
        sessionStorage.setItem('admin-pin', pin)
        setAuth({ email, pin })
      }}
    />
  )
}

/* ---------------- tela de login ---------------- */

function LoginScreen({
  onOk,
}: {
  onOk: (email: string, pin: string) => void
}) {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function submit() {
    const emailOk =
      email.trim().toLowerCase() === SITE_CONFIG.adminEmail.toLowerCase()
    const pinOk = pin === SITE_CONFIG.adminPin
    if (emailOk && pinOk) {
      onOk(email.trim().toLowerCase(), pin)
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#2b0a16] px-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-amber-500/30 bg-[#421022] p-8 text-center shadow-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 ring-2 ring-amber-400/50">
          <Lock className="h-8 w-8 text-amber-400" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-black uppercase text-white">Painel de pedidos</h1>
        <p className="mt-1.5 text-sm text-rose-200/60">
          Entre com seu e-mail e senha para ver os pedidos da loja
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="mt-6 space-y-3"
        >
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-200/40"
              aria-hidden="true"
            />
            <input
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(false)
              }}
              aria-label="E-mail do painel"
              placeholder="seu@email.com"
              className="h-14 w-full rounded-2xl border-2 border-amber-400/25 bg-white/5 pl-12 pr-4 text-left text-base font-bold text-white placeholder:text-rose-200/30 focus-visible:border-amber-400 focus-visible:outline-none focus-visible:ring-amber-400"
            />
          </div>
          <input
            type="password"
            autoComplete="current-password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
            aria-label="Senha do painel"
            placeholder="••••"
            className="h-16 w-full rounded-2xl border-2 border-amber-400/25 bg-white/5 text-center text-3xl font-black tracking-[0.4em] text-white placeholder:text-rose-200/30 focus-visible:border-amber-400 focus-visible:outline-none focus-visible:ring-amber-400"
          />
          {error && (
            <p role="alert" className="text-sm font-bold text-red-400">
              E-mail ou senha incorretos. Tente de novo.
            </p>
          )}
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-lg font-black uppercase tracking-wide text-[#2b0a16] shadow-lg transition hover:bg-amber-300"
          >
            Entrar no painel
          </button>
          <a
            href="#loja"
            className="mt-2 block text-sm font-bold text-rose-200/60 underline underline-offset-4 transition hover:text-white"
          >
            Voltar para a loja
          </a>
        </form>
      </div>
    </div>
  )
}

/* ---------------- painel principal ---------------- */

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'x-admin-pin': SITE_CONFIG.adminPin,
          'x-admin-email': SITE_CONFIG.adminEmail,
        },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setOrders(json.orders)
      setLoadError(null)
    } catch {
      setLoadError('Não foi possível carregar os pedidos. Toque em atualizar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // atualiza sozinho a cada 20 segundos
  useEffect(() => {
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  async function advance(o: Order) {
    const next = NEXT_ACTION[o.status]?.next
    if (!next) return
    setAdvancing(o.code)
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': SITE_CONFIG.adminPin,
          'x-admin-email': SITE_CONFIG.adminEmail,
        },
        body: JSON.stringify({ code: o.code, status: next }),
      })
      await load()
    } finally {
      setAdvancing(null)
    }
  }

  async function copyAddress(o: Order) {
    const text = `${o.customerName} - ${o.phone}\n${o.street}, ${o.number}${o.complement ? ` - ${o.complement}` : ''} - ${o.neighborhood} - ${o.city}/${o.state} - CEP ${o.cep}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(o.code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // clipboard indisponível — ignora
    }
  }

  function chatUrl(o: Order): string {
    const digits = onlyDigits(o.phone)
    const full = digits.startsWith('55') ? digits : `55${digits}`
    const first = o.customerName.split(' ')[0]
    const msg =
      o.status === 'pago'
        ? `Olá ${first}! Aqui é do Club do Garimpo 🎄 Recebi seu Pix do pedido *${o.code}* (${brl(o.totalValue)})${o.lightsKit ? ' com o Kit Luzinhas' : ''}. Vou separar sua árvore e combinar a entrega por aqui!`
        : `Olá ${first}! Aqui é do Club do Garimpo 🎄 Recebi seu pedido *${o.code}* (${brl(o.totalValue)})${o.lightsKit ? ' com o Kit Luzinhas' : ''}. Vou te enviar a chave Pix e combinar a entrega por aqui!`
    return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
  }

  const totalOrders = orders?.length ?? 0
  const waitingPix =
    orders?.filter((o) => o.status === 'novo' || o.status === 'aguardando_pagamento').length ?? 0
  const revenue =
    orders?.filter((o) => o.status === 'pago' || o.status === 'enviado').reduce(
      (sum, o) => sum + o.totalValue,
      0
    ) ?? 0

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#2b0a16]">
      {/* ---------- cabeçalho ---------- */}
      <header className="sticky top-0 z-10 border-b-2 border-amber-400/25 bg-[#421022]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <p className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
              <TreePine className="h-6 w-6 text-[#2b0a16]" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black uppercase text-white">
                Painel de pedidos
              </span>
              <span className="block text-xs font-bold text-amber-400">
                {SITE_CONFIG.brand}
              </span>
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              aria-label="Atualizar pedidos"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400/25 bg-white/5 text-rose-100/80 transition hover:border-amber-400 hover:text-white"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="#loja"
              aria-label="Ver a loja"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400/25 bg-white/5 text-rose-100/80 transition hover:border-amber-400 hover:text-white"
            >
              <Store className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair do painel"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400/25 bg-white/5 text-rose-100/80 transition hover:border-red-400 hover:text-red-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-24">
        {/* ---------- resumo ---------- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-400/25 bg-white/5 p-4 text-center">
            <p className="text-3xl font-black text-white">{totalOrders}</p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-rose-200/60">
              Pedidos
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-center">
            <p className="text-3xl font-black text-amber-400">{waitingPix}</p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-amber-400/80">
              Aguardando Pix
            </p>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-3.5">
            <p className="text-sm font-bold uppercase tracking-wide text-[#25D366]/90">
              Receita total
            </p>
            <p className="text-2xl font-black text-[#25D366]">{brl(revenue)}</p>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-rose-200/40">
          Atualiza sozinho a cada 20 segundos · site/#pedidos
        </p>

        {/* ---------- mensagens ---------- */}
        {loadError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border-2 border-red-500/40 bg-red-500/10 p-4 text-center text-sm font-bold text-red-400"
          >
            {loadError}
          </p>
        )}

        {orders && orders.length === 0 && (
          <div className="mt-10 flex flex-col items-center text-center text-rose-200/60">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-2 ring-amber-900/50">
              <Package className="h-10 w-10 text-amber-400" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-black text-white">Nenhum pedido ainda</p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed">
              Quando alguém comprar no site, o pedido aparece aqui na hora.
            </p>
          </div>
        )}

        {/* ---------- lista de pedidos ---------- */}
        <div className="mt-5 space-y-4">
          {orders?.map((o) => (
            <article
              key={o.id}
              className="rounded-2xl border-2 border-amber-400/25 bg-[#421022] p-4"
            >
              {/* código + status */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-black tracking-wide text-amber-400">{o.code}</p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${STATUS_CLS[o.status] ?? ''}`}
                >
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-rose-200/40">{fmtDate(o.createdAt)}</p>

              {/* cliente */}
              <div className="mt-3">
                <p className="text-base font-black text-white">{o.customerName}</p>
                <p className="text-sm text-rose-100/80">
                  {o.phone}
                  {o.cpf ? ` · CPF ${o.cpf.slice(0, 3)}.***.${o.cpf.slice(-2)}` : ''}
                </p>
              </div>

              {/* endereço */}
              <div className="mt-2 rounded-xl bg-white/5 p-3">
                <p className="text-sm leading-relaxed text-rose-100/80">
                  {o.street}, {o.number}
                  {o.complement ? ` - ${o.complement}` : ''}
                  <br />
                  {o.neighborhood} · {o.city}/{o.state} · CEP {o.cep}
                </p>
                <button
                  type="button"
                  onClick={() => copyAddress(o)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400 underline underline-offset-4 transition hover:text-amber-300"
                >
                  {copiedCode === o.code ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Endereço copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar endereço
                    </>
                  )}
                </button>
              </div>

              {/* itens */}
              <div className="mt-3 space-y-1 text-sm text-rose-100/80">
                <p className="flex justify-between">
                  <span>
                    {o.quantity} × Árvore 2m + kit 54 enfeites
                  </span>
                  <span className="font-bold">{brl(o.quantity * SITE_CONFIG.priceValue)}</span>
                </p>
                {o.lightsKit && (
                  <p className="flex justify-between font-bold text-[#25D366]">
                    <span className="flex items-center gap-1.5">
                      <Clipboard className="h-4 w-4" aria-hidden="true" /> Kit Luzinhas
                    </span>
                    <span>+ {brl(SITE_CONFIG.lightsKitPrice)}</span>
                  </p>
                )}
                <p className="flex justify-between border-t border-amber-400/25 pt-2 text-base font-black text-white">
                  <span>Total</span>
                  <span className="text-amber-400">{brl(o.totalValue)}</span>
                </p>
              </div>

              {/* ações */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={chatUrl(o)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black uppercase tracking-wide text-[#0b3d1f] transition hover:bg-[#2fe073]"
                >
                  <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Chamar no WhatsApp
                </a>
                {NEXT_ACTION[o.status] && (
                  <button
                    type="button"
                    onClick={() => advance(o)}
                    disabled={advancing === o.code}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-amber-400/60 bg-amber-400/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-amber-400 transition hover:bg-amber-400/20 disabled:opacity-60"
                  >
                    {advancing === o.code ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      (() => {
                        const act = NEXT_ACTION[o.status]
                        const Icon = act!.icon
                        return <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      })()
                    )}
                    {NEXT_ACTION[o.status]!.label}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
