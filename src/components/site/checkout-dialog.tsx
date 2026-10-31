'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  QrCode,
  Loader2,
  Check,
  MapPin,
  ShoppingBag,
  X,
  MessageCircle,
  Copy,
  Clock,
  Truck,
  User,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SITE_CONFIG, whatsappOrderUrl } from '@/config'
import { isValidCpf, maskCpf } from '@/lib/cpf'

/* ---------------- fluxo "Pix primeiro" ----------------
   1. clica em Comprar → QR Code do Pix aparece na hora
   2. paga → confirma sozinho (polling + webhook)
   3. aí sim aparece o formulário de endereço
------------------------------------------------------- */

type Phase = 'gerando' | 'pix' | 'form' | 'enviando' | 'sucesso' | 'erro'

type OrderInfo = {
  code: string
  totalValue: number
  quantity: number
}

type PaymentInfo = {
  available: boolean
  demo: boolean
  copyPaste?: string
  qrBase64?: string | null
  reason?: string
}

const formSchema = z.object({
  customerName: z.string().min(3, 'Escreva seu nome completo'),
  cpf: z
    .string()
    .refine((v) => isValidCpf(v), 'Confira o CPF — parece incompleto ou errado'),
  phone: z
    .string()
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Número incompleto'),
  cep: z
    .string()
    .refine((v) => v.replace(/\D/g, '').length === 8, 'CEP incompleto'),
  street: z.string().min(2, 'Escreva o nome da rua'),
  number: z.string().min(1, 'Obrigatório'),
  complement: z.string().max(200).optional(),
  neighborhood: z.string().min(2, 'Escreva o bairro'),
  city: z.string().min(2, 'Escreva a cidade'),
  state: z
    .string()
    .length(2, 'UF inválida')
    .refine((v) => /^[A-Za-z]{2}$/.test(v), 'UF inválida'),
})

type CheckoutData = z.infer<typeof formSchema>

/** Pix em andamento guardado no navegador — se a pessoa fechar e reabrir,
 *  mostra o MESMO QR em vez de criar pedido repetido. */
const STORE_KEY = 'checkout-pix-andamento'

function loadPending(): (OrderInfo & { copyPaste: string; qrBase64: string | null; savedAt: number }) | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // válido por 3 horas
    if (Date.now() - data.savedAt > 3 * 60 * 60 * 1000) return null
    return data
  } catch {
    return null
  }
}

function savePending(data: OrderInfo & { copyPaste: string; qrBase64: string | null }) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }))
  } catch {
    /* storage cheio/bloqueado — segue sem guardar */
  }
}

function clearPending() {
  try {
    sessionStorage.removeItem(STORE_KEY)
  } catch {
    /* ignora */
  }
}

/* ---------------- máscaras e utilidades ---------------- */

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function maskCep(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/* ---------------- estilos compartilhados (bem grandes, para qualquer idade) ---------------- */

const inputCls =
  'h-14 rounded-xl border-2 border-rose-200 bg-white text-lg text-rose-950 placeholder:text-stone-400 focus-visible:border-rose-500 focus-visible:ring-rose-400'
const labelCls = 'text-base font-bold text-rose-950'
const errorCls = 'text-sm font-bold text-red-600'

/* ---------------- componente ---------------- */

export default function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [phase, setPhase] = useState<Phase>('gerando')
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepFound, setCepFound] = useState(false)
  const startedRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      cpf: '',
      phone: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  })

  /* 🎯 ao abrir: cria o pedido + Pix na hora (ou retoma o que estava em andamento) */
  useEffect(() => {
    if (!open) {
      startedRef.current = false
      return
    }
    if (startedRef.current) return
    startedRef.current = true

    setServerError(null)
    setPhase('gerando')

    const pend = loadPending()
    if (pend) {
      setOrder({ code: pend.code, totalValue: pend.totalValue, quantity: pend.quantity })
      setPayment({ available: true, demo: false, copyPaste: pend.copyPaste, qrBase64: pend.qrBase64 })
      setPhase('pix')
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: 1, lightsKit: false, paymentMethod: 'pix' }),
        })
        const json = await res.json()
        if (!res.ok || !json.payment?.available) {
          throw new Error(json.payment?.reason || json.error || 'Erro ao gerar o Pix')
        }
        setOrder(json.order)
        setPayment(json.payment)
        savePending({
          code: json.order.code,
          totalValue: json.order.totalValue,
          quantity: json.order.quantity,
          copyPaste: json.payment.copyPaste,
          qrBase64: json.payment.qrBase64 ?? null,
        })
        setPhase('pix')
      } catch (e) {
        setServerError(e instanceof Error ? e.message : 'Erro inesperado ao gerar o Pix.')
        setPhase('erro')
      }
    })()
  }, [open])

  /* 🔄 pergunta ao servidor a cada 4s se o Pix já caiu */
  useEffect(() => {
    if (phase !== 'pix' || !order) return
    let cancelado = false

    const t = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?code=${encodeURIComponent(order.code)}`
        )
        if (!res.ok || cancelado) return
        const json = (await res.json()) as { status?: string }
        if (json.status === 'pago') {
          clearPending()
          if (!cancelado) setPhase('form')
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }, 4000)

    return () => {
      cancelado = true
      clearInterval(t)
    }
  }, [phase, order])

  /* 🧹 limpa o formulário quando fecha depois de tudo concluído */
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        if (phase === 'sucesso') {
          setOrder(null)
          setPayment(null)
          setPhase('gerando')
          reset()
        }
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open, phase, reset])

  /* copia o código Pix (com fallback pra celulares teimosos) */
  const copyPix = useCallback(async () => {
    const code = payment?.copyPaste
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [payment])

  /* busca endereço pelo CEP (ViaCEP) */
  async function lookupCep() {
    const digits = (getValues('cep') || '').replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        if (data.logradouro) setValue('street', data.logradouro, { shouldValidate: true })
        if (data.bairro) setValue('neighborhood', data.bairro, { shouldValidate: true })
        if (data.localidade) setValue('city', data.localidade, { shouldValidate: true })
        if (data.uf) setValue('state', data.uf, { shouldValidate: true })
        setCepFound(true)
      } else {
        setCepFound(false)
      }
    } catch {
      // falha silenciosa: cliente preenche manualmente
    } finally {
      setCepLoading(false)
    }
  }

  /* salva o endereço no MESMO pedido, depois de pago */
  async function onSubmit(values: CheckoutData) {
    if (!order) return
    setServerError(null)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar o endereço')
      setPhase('sucesso')
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.')
    }
  }

  const whatsMsg = order
    ? `Olá! 🎄 Paguei o pedido *${order.code}* no Pix (${brl(order.totalValue)}). Já salvei meu endereço aqui no site — pode confirmar o envio?`
    : ''

  const heading =
    phase === 'gerando'
      ? 'Gerando seu pagamento…'
      : phase === 'pix'
        ? 'Pague com Pix'
        : phase === 'form' || phase === 'enviando'
          ? 'Endereço da entrega'
          : phase === 'sucesso'
            ? 'Tudo certo! 🎄'
            : 'Ops, tivemos um problema'

  const description =
    phase === 'gerando'
      ? 'Um instante — já vai aparecer o QR Code'
      : phase === 'pix'
        ? 'Escaneie ou copie o código · confirma sozinho'
        : phase === 'form' || phase === 'enviando'
          ? 'Pagamento aprovado! Falta só onde entregar'
          : phase === 'sucesso'
            ? 'Pedido confirmado com endereço salvo'
            : 'Não consegui gerar o Pix agora'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] flex-col gap-0 rounded-none border-0 bg-[#FBF7F2] p-0 text-rose-950 sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-lg sm:rounded-3xl sm:border-2 sm:border-rose-200"
      >
        {/* ---------- cabeçalho fixo ---------- */}
        <div className="flex items-center justify-between gap-3 border-b border-rose-200 bg-white px-4 py-3 sm:px-6">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-wide sm:text-2xl">
              <ShoppingBag className="h-6 w-6 shrink-0 text-rose-600" aria-hidden="true" />
              {heading}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-stone-500">
              {description}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-stone-500 transition hover:border-rose-400 hover:text-rose-700"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* ---------- conteúdo com rolagem ---------- */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {phase === 'gerando' && (
            /* ================= CARREGANDO O PIX ================= */
            <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
              <Loader2 className="h-14 w-14 animate-spin text-rose-600" aria-hidden="true" />
              <p className="font-display text-2xl font-black text-rose-950">
                Gerando seu pagamento…
              </p>
              <p className="max-w-xs text-base leading-relaxed text-stone-600">
                Já estamos criando o QR Code do Pix para a sua árvore de Natal. 🎄
              </p>
            </div>
          )}

          {phase === 'pix' && payment?.available && order && (
            /* ================= TELA DE PAGAMENTO PIX ================= */
            <div className="flex flex-col items-center pt-3 text-center">
              {payment.demo && (
                <p className="w-full rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-bold leading-snug text-amber-800">
                  🧪 Modo demonstração — cadastre as chaves da MisticPay nas variáveis de
                  ambiente para receber Pix de verdade.
                </p>
              )}

              <p className="mt-3 font-display text-2xl font-black text-rose-950">
                Escaneie o QR Code
              </p>
              <div className="mt-3 rounded-3xl border-4 border-amber-300 bg-white p-3 shadow-md shadow-rose-900/10">
                {payment.qrBase64 ? (
                  <img
                    src={payment.qrBase64}
                    alt="QR Code do Pix para pagar"
                    width={224}
                    height={224}
                    className="h-56 w-56"
                  />
                ) : (
                  <span className="flex h-56 w-56 items-center justify-center">
                    <QrCode className="h-24 w-24 text-stone-300" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="mt-4 w-full rounded-2xl border-2 border-rose-200 bg-white p-4 text-left">
                <p className="flex items-center gap-1.5 text-sm font-bold text-stone-500">
                  <Copy className="h-4 w-4" aria-hidden="true" /> Pix copia e cola
                </p>
                <p className="mt-1.5 line-clamp-3 break-all text-sm leading-snug text-stone-700">
                  {payment.copyPaste}
                </p>
              </div>

              <ol className="mt-4 w-full space-y-2 rounded-2xl bg-amber-50 p-4 text-left text-base leading-snug text-stone-700">
                <li className="flex gap-2.5">
                  <strong className="text-rose-700">1.</strong> Abra o app do seu banco
                </li>
                <li className="flex gap-2.5">
                  <strong className="text-rose-700">2.</strong> Escolha Pix → Copia e cola
                </li>
                <li className="flex gap-2.5">
                  <strong className="text-rose-700">3.</strong> Cole o código e confirme o
                  valor de {brl(order.totalValue)}
                </li>
              </ol>

              <p className="mt-4 flex items-center gap-2 text-base font-bold text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Aguardando o pagamento… confirmamos sozinhos
              </p>

              <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-500">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Depois de pagar, a gente te pede o endereço aqui mesmo
              </p>

              <a
                href={whatsappOrderUrl(
                  `Olá! 🎄 Estou pagando o pedido *${order.code}* (${brl(order.totalValue)}) no Pix, mas preciso de ajuda.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm font-bold text-stone-500 underline underline-offset-4 transition hover:text-rose-700"
              >
                Já paguei e não confirmou? Fale com a gente
              </a>
            </div>
          )}

          {(phase === 'form' || phase === 'enviando') && order && (
            /* ================= FORMULÁRIO PÓS-PAGAMENTO ================= */
            <>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-[#25D366]/50 bg-[#25D366]/10 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 ring-2 ring-[#25D366]/60">
                  <Check className="h-6 w-6 text-[#1d7a3f]" aria-hidden="true" />
                </span>
                <p className="text-base font-bold leading-snug text-[#1d7a3f]">
                  Pagamento de {brl(order.totalValue)} aprovado! Pedido{' '}
                  <span className="font-black">{order.code}</span> — agora nos diga onde
                  entregar. 🎄
                </p>
              </div>

              <form
                id="checkout-form"
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-7"
                noValidate
              >
                {/* ---------- 1. dados pessoais ---------- */}
                <div className="space-y-3">
                  <p className="flex items-center gap-2.5 text-lg font-black text-rose-950">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-base font-black text-white shadow-md shadow-rose-900/25">
                      1
                    </span>
                    <User className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
                    Quem comprou
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerName" className={labelCls}>
                      Seu nome completo
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="Ex.: Maria da Silva"
                      autoComplete="name"
                      enterKeyHint="next"
                      className={inputCls}
                      {...register('customerName')}
                    />
                    {errors.customerName && (
                      <p className={errorCls} role="alert">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cpf" className={labelCls}>
                      Seu CPF
                    </Label>
                    <Input
                      id="cpf"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      autoComplete="cpf"
                      enterKeyHint="next"
                      className={inputCls}
                      value={getValues('cpf') ?? ''}
                      onChange={(e) =>
                        setValue('cpf', maskCpf(e.target.value), { shouldValidate: true })
                      }
                    />
                    {errors.cpf && (
                      <p className={errorCls} role="alert">{errors.cpf.message}</p>
                    )}
                    <p className="text-sm text-stone-500">
                      O Pix já saiu — usamos o CPF só para a nota e a garantia
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className={labelCls}>
                      Seu WhatsApp (com DDD)
                    </Label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      enterKeyHint="next"
                      className={inputCls}
                      value={getValues('phone') ?? ''}
                      onChange={(e) =>
                        setValue('phone', maskPhone(e.target.value), { shouldValidate: true })
                      }
                    />
                    {errors.phone && (
                      <p className={errorCls} role="alert">{errors.phone.message}</p>
                    )}
                    <p className="text-sm text-stone-500">
                      É por aqui que enviamos o rastreio
                    </p>
                  </div>
                </div>

                {/* ---------- 2. endereço ---------- */}
                <div className="space-y-3">
                  <p className="flex items-center gap-2.5 text-lg font-black text-rose-950">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-base font-black text-white shadow-md shadow-rose-900/25">
                      2
                    </span>
                    <MapPin className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
                    Endereço da entrega
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="cep" className={labelCls}>
                      CEP da sua rua
                    </Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        inputMode="numeric"
                        placeholder="00000-000"
                        autoComplete="postal-code"
                        enterKeyHint="next"
                        className={`${inputCls} pr-12`}
                        value={getValues('cep') ?? ''}
                        onChange={(e) => {
                          setValue('cep', maskCep(e.target.value), { shouldValidate: true })
                          setCepFound(false)
                        }}
                        onBlur={lookupCep}
                      />
                      {cepLoading && (
                        <Loader2
                          className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 animate-spin text-rose-500"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {errors.cep && (
                      <p className={errorCls} role="alert">{errors.cep.message}</p>
                    )}
                    {cepFound && !errors.cep && (
                      <p className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Endereço encontrado! Confira abaixo
                      </p>
                    )}
                    {!cepFound && !cepLoading && (
                      <p className="text-sm text-stone-500">
                        Digite o CEP e o resto do endereço preenche sozinho
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3 space-y-1.5">
                      <Label htmlFor="street" className={labelCls}>
                        Rua / Avenida
                      </Label>
                      <Input
                        id="street"
                        placeholder="Ex.: Rua das Flores"
                        autoComplete="address-line1"
                        enterKeyHint="next"
                        className={inputCls}
                        {...register('street')}
                      />
                      {errors.street && (
                        <p className={errorCls} role="alert">{errors.street.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="number" className={labelCls}>
                        Número
                      </Label>
                      <Input
                        id="number"
                        inputMode="numeric"
                        placeholder="123"
                        className={inputCls}
                        {...register('number')}
                      />
                      {errors.number && (
                        <p className={errorCls} role="alert">{errors.number.message}</p>
                      )}
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="complement" className={labelCls}>
                        Complemento <span className="font-normal text-stone-500">(opcional)</span>
                      </Label>
                      <Input
                        id="complement"
                        placeholder="Apto, bloco…"
                        className={inputCls}
                        {...register('complement')}
                      />
                    </div>

                    <div className="col-span-3 space-y-1.5">
                      <Label htmlFor="neighborhood" className={labelCls}>
                        Bairro
                      </Label>
                      <Input
                        id="neighborhood"
                        placeholder="Ex.: Centro"
                        className={inputCls}
                        {...register('neighborhood')}
                      />
                      {errors.neighborhood && (
                        <p className={errorCls} role="alert">{errors.neighborhood.message}</p>
                      )}
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="city" className={labelCls}>
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        placeholder="Ex.: São Paulo"
                        autoComplete="address-level2"
                        className={inputCls}
                        {...register('city')}
                      />
                      {errors.city && (
                        <p className={errorCls} role="alert">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="state" className={labelCls}>
                        Estado (UF)
                      </Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        maxLength={2}
                        inputMode="text"
                        autoComplete="address-level1"
                        className={`${inputCls} uppercase`}
                        {...register('state', {
                          onChange: (e) =>
                            setValue('state', e.target.value.toUpperCase().slice(0, 2), {
                              shouldValidate: true,
                            }),
                        })}
                      />
                      {errors.state && (
                        <p className={errorCls} role="alert">{errors.state.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {serverError && (
                  <p
                    role="alert"
                    className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-base font-bold text-red-600"
                  >
                    {serverError}
                  </p>
                )}
              </form>
            </>
          )}

          {phase === 'sucesso' && order && (
            /* ================= SUCESSO ================= */
            <div className="flex flex-col items-center pt-4 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/15 ring-4 ring-[#25D366]/60">
                <Check className="h-10 w-10 text-[#25D366]" aria-hidden="true" />
              </span>

              <p className="mt-4 font-display text-2xl font-black text-rose-950">
                Pedido confirmado! 🎉
              </p>
              <p className="mt-2 max-w-sm text-base leading-relaxed text-stone-600">
                Pagamento de <strong className="text-rose-950">{brl(order.totalValue)}</strong>{' '}
                aprovado e endereço salvo. Sua árvore já está sendo separada com carinho!
              </p>

              <div className="mt-5 w-full rounded-2xl border-2 border-amber-300 bg-white p-5 text-left shadow-sm">
                <p className="flex items-center justify-between text-base font-bold text-stone-600">
                  <span>Número do pedido</span>
                  <span className="text-xl font-black text-rose-700">{order.code}</span>
                </p>
                <p className="mt-3 flex items-center justify-between text-base text-stone-600">
                  <span>Árvore 2m + kit 54 enfeites</span>
                  <span className="font-bold">×{order.quantity}</span>
                </p>
                <p className="mt-3 flex items-center justify-between border-t-2 border-rose-200 pt-3 text-xl font-black text-rose-950">
                  <span>Total pago</span>
                  <span className="text-rose-700">{brl(order.totalValue)}</span>
                </p>
              </div>
            </div>
          )}

          {phase === 'erro' && (
            /* ================= ERRO AO GERAR PIX ================= */
            <div className="flex flex-col items-center pt-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 ring-2 ring-red-300">
                <X className="h-8 w-8 text-red-500" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-bold text-red-600">{serverError}</p>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-stone-600">
                Sem problema — você pode tentar de novo agora ou falar com a gente no
                WhatsApp que resolvemos rapidinho. 🎄
              </p>
              {serverError && serverError.includes('MisticPay') && (
                <p className="mt-3 max-w-sm break-all rounded-xl bg-white/60 p-3 text-xs text-stone-400">
                  {serverError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ---------- rodapé fixo com o botão grande ---------- */}
        <div className="border-t-2 border-rose-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {phase === 'gerando' && (
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white opacity-80"
            >
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              Gerando seu pagamento…
            </button>
          )}

          {phase === 'pix' && (
            <>
              <button
                type="button"
                onClick={copyPix}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4 text-lg font-black uppercase tracking-wide text-rose-950 shadow-lg shadow-amber-900/30 transition hover:from-amber-300 hover:to-amber-400"
              >
                {copied ? (
                  <>
                    <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
                    Código copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-6 w-6 shrink-0" aria-hidden="true" />
                    Copiar código do Pix
                  </>
                )}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-sm font-bold text-stone-500">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Assim que pagar, a confirmação sai sozinha aqui
              </p>
            </>
          )}

          {(phase === 'form' || phase === 'enviando') && (
            <>
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || phase === 'enviando'}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting || phase === 'enviando' ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    Salvando endereço…
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6" aria-hidden="true" />
                    Salvar endereço e finalizar
                  </>
                )}
              </button>
              {serverError && (
                <p role="alert" className="mt-2 text-center text-sm font-bold text-red-600">
                  {serverError}
                </p>
              )}
            </>
          )}

          {phase === 'sucesso' && order && (
            <>
              <a
                href={whatsappOrderUrl(whatsMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-lg font-black uppercase tracking-wide text-[#0b3d1f] shadow-lg shadow-emerald-950/30 transition hover:bg-[#2fe073]"
              >
                <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
                Avisar no WhatsApp
              </a>
              <Link
                href={`/pedido/${order.code}`}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-300 bg-white px-6 py-3.5 text-base font-black uppercase tracking-wide text-rose-700 shadow-sm transition hover:border-rose-500"
              >
                <Truck className="h-5 w-5 shrink-0" aria-hidden="true" />
                Acompanhar meu pedido
              </Link>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-2 w-full rounded-xl py-2 text-center text-base font-bold text-stone-500 underline underline-offset-4 transition hover:text-rose-700"
              >
                Continuar navegando
              </button>
            </>
          )}

          {phase === 'erro' && (
            <>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  setTimeout(() => onOpenChange(true), 350)
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700"
              >
                <QrCode className="h-6 w-6" aria-hidden="true" />
                Tentar de novo
              </button>
              <a
                href={whatsappOrderUrl(
                  'Olá! 🎄 Quero comprar a Árvore de Natal 2m por R$ 80, mas o site não gerou meu Pix. Pode me ajudar?'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-base font-black uppercase tracking-wide text-[#0b3d1f] shadow-md transition hover:bg-[#2fe073]"
              >
                <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                Comprar pelo WhatsApp
              </a>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
