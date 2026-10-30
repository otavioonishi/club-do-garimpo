'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Minus,
  Plus,
  QrCode,
  Loader2,
  Check,
  MapPin,
  ShoppingBag,
  User,
  X,
  MessageCircle,
  Sparkles,
  Copy,
  Clock,
  Truck,
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

/* ---------------- schema e máscaras ---------------- */

const checkoutSchema = z.object({
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

type CheckoutData = z.infer<typeof checkoutSchema>

type OrderResponse = {
  ok: boolean
  order: {
    code: string
    quantity: number
    totalValue: number
    customerName: string
    paymentMethod: string
    lightsKit: boolean
  }
  payment?: {
    available: boolean
    demo: boolean
    copyPaste?: string
    qrBase64?: string | null
  }
}

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

function StepTitle({
  n,
  icon: Icon,
  children,
}: {
  n: number
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <p className="flex items-center gap-2.5 text-lg font-black text-rose-950">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-base font-black text-white shadow-md shadow-rose-900/25">
        {n}
      </span>
      <Icon className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
      {children}
    </p>
  )
}

/* ---------------- componente ---------------- */

export default function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [lightsKit, setLightsKit] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepFound, setCepFound] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderResponse['order'] | null>(null)
  const [payment, setPayment] = useState<OrderResponse['payment'] | null>(null)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState(false)
  const [whatsMsg, setWhatsMsg] = useState('')
  const [paidMsg, setPaidMsg] = useState('')

  const total =
    quantity * SITE_CONFIG.priceValue + (lightsKit ? SITE_CONFIG.lightsKitPrice : 0)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
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

  // Limpa tudo depois que o diálogo fecha
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setOrder(null)
        setPayment(null)
        setPaid(false)
        setCopied(false)
        setServerError(null)
        setCepFound(false)
        setQuantity(1)
        setLightsKit(false)
        reset()
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open, reset])

  /* pergunta ao servidor a cada 5s se o Pix já caiu */
  useEffect(() => {
    if (!order || !payment?.available || paid) return
    const t = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?code=${encodeURIComponent(order.code)}`
        )
        if (!res.ok) return
        const json = (await res.json()) as { status?: string }
        if (json.status === 'pago') setPaid(true)
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }, 5000)
    return () => clearInterval(t)
  }, [order, payment?.available, paid])

  /* copia o código Pix (com fallback pra celulares teimosos) */
  async function copyPix() {
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
  }

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

  async function onSubmit(values: CheckoutData) {
    setServerError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, quantity, lightsKit, paymentMethod: 'pix' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar pedido')
      setOrder(json.order)
      setPayment(json.payment ?? null)

      const addr = [
        `${values.street}, ${values.number}`,
        values.complement ? values.complement : null,
        values.neighborhood,
        `${values.city}/${values.state.toUpperCase()}`,
        `CEP ${values.cep}`,
      ]
        .filter(Boolean)
        .join(' - ')

      // mensagem enviada quando o Pix já foi pago (confirmação + entrega)
      setPaidMsg(
        `Olá! 🎄 Paguei o pedido *${json.order.code}* no Pix (${brl(json.order.totalValue)}).\n\n` +
          `Nome: ${json.order.customerName}\n` +
          `Telefone: ${values.phone}\n` +
          `Endereço de entrega: ${addr}\n\n` +
          `Pode confirmar o pagamento e combinar a entrega?`
      )

      setWhatsMsg(
        `Olá! 🎄 Acabei de fazer o pedido *${json.order.code}* no site!\n\n` +
          `Produto: Árvore de Natal 2m + kit 54 enfeites\n` +
          `Quantidade: ${json.order.quantity}\n` +
          (lightsKit ? `Kit Luzinhas de Natal: Sim (+${brl(SITE_CONFIG.lightsKitPrice)})\n` : '') +
          `Total: ${brl(json.order.totalValue)}\n` +
          `Pagamento: Pix\n` +
          `Nome: ${json.order.customerName}\n` +
          `Telefone: ${values.phone}\n` +
          `Endereço de entrega: ${addr}\n\n` +
          `Pode me enviar a chave Pix e confirmar a entrega?`
      )
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.')
    }
  }

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
              <ShoppingBag className="h-6 w-6 text-rose-600" aria-hidden="true" />
              {order
                ? payment?.available
                  ? paid
                    ? 'Pagamento aprovado!'
                    : 'Pague com Pix'
                  : 'Pedido confirmado!'
                : 'Complete seu pedido'}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-stone-500">
              {order
                ? payment?.available
                  ? paid
                    ? 'Falta só combinar a entrega no WhatsApp'
                    : 'Escaneie ou copie o código · confirma sozinho'
                  : 'Falta só um passo no WhatsApp'
                : 'Leva menos de 1 minuto · pagamento no Pix'}
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
          {order ? (
            payment?.available ? (
              /* ================= TELA DE PAGAMENTO PIX ================= */
              <div className="flex flex-col items-center pt-3 text-center">
                {payment.demo && (
                  <p className="w-full rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-bold leading-snug text-amber-800">
                    🧪 Modo demonstração — cadastre as chaves da MisticPay no arquivo .env
                    para receber Pix de verdade.
                  </p>
                )}

                {paid ? (
                  <>
                    <span className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/15 ring-4 ring-[#25D366]/60">
                      <Check className="h-10 w-10 text-[#25D366]" aria-hidden="true" />
                    </span>
                    <p className="mt-4 font-display text-2xl font-black text-rose-950">
                      Pagamento aprovado! 🎉
                    </p>
                    <p className="mt-2 text-base leading-relaxed text-stone-600">
                      Recebemos o Pix de{' '}
                      <strong className="text-rose-950">{brl(order.totalValue)}</strong> — pedido{' '}
                      <strong className="text-rose-700">{order.code}</strong>. Sua árvore já está
                      sendo separada!
                    </p>

                    {order.lightsKit && (
                      <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-3 text-base font-bold text-[#1d7a3f]">
                        <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                        Kit Luzinhas incluído — já vai na mesma caixa!
                      </p>
                    )}

                    <p className="mt-4 w-full rounded-2xl border-2 border-rose-200 bg-white p-4 text-base font-bold text-rose-950">
                      Último passo: toque no botão verde abaixo pra avisar nossa equipe e
                      combinar a entrega. 🎄
                    </p>
                  </>
                ) : (
                  <>
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

                    <a
                      href={whatsappOrderUrl(whatsMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-sm font-bold text-stone-500 underline underline-offset-4 transition hover:text-rose-700"
                    >
                      Não consegui pagar pelo site
                    </a>
                  </>
                )}
              </div>
            ) : (
              /* ================= TELA DE SUCESSO (chave vai no WhatsApp) ================= */
              <div className="flex flex-col items-center pt-4 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/15 ring-4 ring-[#25D366]/60">
                <Check className="h-10 w-10 text-[#25D366]" aria-hidden="true" />
              </span>

              <p className="mt-4 font-display text-2xl font-black text-rose-950">
                Tudo certo, {order.customerName.split(' ')[0]}! 🎄
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
                <p className="mt-2 flex items-center justify-between text-base text-stone-600">
                  <span>Pagamento</span>
                  <span className="flex items-center gap-1.5 font-bold text-rose-700">
                    <QrCode className="h-5 w-5" aria-hidden="true" /> Pix
                  </span>
                </p>
                <p className="mt-3 flex items-center justify-between border-t-2 border-rose-200 pt-3 text-xl font-black text-rose-950">
                  <span>Total</span>
                  <span className="text-rose-700">{brl(order.totalValue)}</span>
                </p>
              </div>

              {order.lightsKit && (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-3 text-base font-bold text-[#1d7a3f]">
                  <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Kit Luzinhas incluído — já vai na mesma caixa!
                </p>
              )}

              <p className="mt-5 text-base leading-relaxed text-stone-600">
                <strong className="text-rose-950">Falta só 1 passo:</strong> toque no botão
                verde abaixo para enviar seu pedido no WhatsApp. Nossa equipe responde com
                a chave Pix para você pagar.
              </p>
              </div>
            )
          ) : (
            /* ================= FORMULÁRIO ================= */
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
              {/* ---------- 1. dados pessoais ---------- */}
              <div className="space-y-3">
                <StepTitle n={1} icon={User}>Seus dados</StepTitle>

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
                    O banco usa o CPF pra registrar o Pix — só isso mesmo
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
                    É por aqui que enviamos a chave Pix e o rastreio
                  </p>
                </div>
              </div>

              {/* ---------- 2. endereço ---------- */}
              <div className="space-y-3">
                <StepTitle n={2} icon={MapPin}>Endereço da entrega</StepTitle>

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

              {/* ---------- 3. pagamento no Pix (único, sem escolhas) ---------- */}
              <div className="space-y-3">
                <StepTitle n={3} icon={QrCode}>Pagamento no Pix</StepTitle>

                <div className="flex items-start gap-4 rounded-2xl border-2 border-amber-300/80 bg-amber-50 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400">
                    <QrCode className="h-7 w-7 text-rose-950" aria-hidden="true" />
                  </span>
                  <div className="text-base leading-relaxed text-stone-600">
                    <p className="font-black text-rose-950">Você paga com Pix</p>
                    <p className="mt-1">
                      Depois de confirmar, enviamos a chave Pix no seu WhatsApp. Aprovação
                      na hora e sem taxas.
                    </p>
                  </div>
                </div>
              </div>

              {/* ---------- extra: kit luzinhas (+R$ 20) ---------- */}
              <div
                className={`rounded-2xl border-2 p-4 transition ${
                  lightsKit ? 'border-rose-500 bg-rose-100' : 'border-rose-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  aria-pressed={lightsKit}
                  onClick={() => setLightsKit((v) => !v)}
                  className="w-full text-left"
                >
                  <span className="flex items-center gap-3">
                    <Image
                      src="/kit-luzinhas.png"
                      alt="Kit Luzinhas de Natal — pisca-pisca de luz quente"
                      width={72}
                      height={72}
                      className="h-16 w-16 shrink-0 rounded-xl border border-rose-200 object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-black leading-tight text-rose-950">
                        Kit Luzinhas de Natal
                      </span>
                      <span className="mt-0.5 block text-lg font-black text-rose-700">
                        + {brl(SITE_CONFIG.lightsKitPrice)}
                      </span>
                    </span>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wide transition ${
                        lightsKit
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-400 text-rose-950'
                      }`}
                    >
                      {lightsKit ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" /> Na sacola
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar
                        </>
                      )}
                    </span>
                  </span>
                  <span className="mt-2.5 block text-sm leading-snug text-stone-600">
                    Luzinhas quentinhas pra árvore brilhar — já vai na mesma caixa,
                    junto com as bolinhas de enfeite.
                  </span>
                </button>
              </div>

              {/* ---------- quantidade ---------- */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-rose-200 bg-white p-4">
                <div>
                  <p className="text-base font-black text-rose-950">Quantas árvores?</p>
                  <p className="text-sm text-stone-500">{brl(SITE_CONFIG.priceValue)} cada</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Tirar uma árvore"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-rose-200 bg-white text-rose-950 transition hover:border-rose-400"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-8 text-center text-xl font-black text-rose-950">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Colocar mais uma árvore"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-rose-200 bg-white text-rose-950 transition hover:border-rose-400"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
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
          )}
        </div>

        {/* ---------- rodapé fixo com o botão grande ---------- */}
        <div className="border-t-2 border-rose-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {order ? (
            payment?.available ? (
              paid ? (
                <>
                  <a
                    href={whatsappOrderUrl(paidMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-lg font-black uppercase tracking-wide text-[#0b3d1f] shadow-lg shadow-emerald-950/30 transition hover:bg-[#2fe073]"
                  >
                    <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
                    Avisar que paguei no WhatsApp
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
              ) : (
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
              )
            ) : (
              <>
              <a
                href={whatsappOrderUrl(whatsMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-lg font-black uppercase tracking-wide text-[#0b3d1f] shadow-lg shadow-emerald-950/30 transition hover:bg-[#2fe073]"
              >
                <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
                Enviar no WhatsApp
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
            )
          ) : (
            <>
              <p className="mb-1 flex items-center justify-between text-lg font-black text-rose-950">
                <span>Total</span>
                <span className="text-2xl text-rose-700">{brl(total)}</span>
              </p>
              <p className="mb-2 text-xs text-stone-500">
                {quantity} × Árvore 2m com kit 54 enfeites{lightsKit ? ' + Kit Luzinhas' : ''}
              </p>
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-4 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6" aria-hidden="true" />
                    Confirmar pedido
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
