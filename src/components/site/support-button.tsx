'use client'

import { useState } from 'react'
import { Headset, X, MessageCircle, Clock, ShieldCheck } from 'lucide-react'
import { SITE_CONFIG, whatsappOrderUrl } from '@/config'

/**
 * Botão flutuante de Suporte — sempre visível no canto da tela.
 * Abre um cartão simples com o prazo de resposta (até 72h após a
 * reclamação) e o botão para registrar a reclamação no WhatsApp.
 */
export default function SupportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar suporte"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Suporte ao cliente"
          className="fixed bottom-[8.75rem] right-4 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border-2 border-rose-200 bg-white shadow-2xl shadow-rose-950/30 lg:bottom-24 sm:right-6"
        >
          {/* cabeçalho */}
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-rose-700 to-rose-900 px-4 py-3">
            <p className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-white">
              <Headset className="h-5 w-5 shrink-0" aria-hidden="true" />
              Suporte ao cliente
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* mensagem de prazo */}
          <div className="px-4 py-4">
            <p className="text-base leading-relaxed text-stone-700">
              Teve algum problema com o pedido, a entrega ou o produto?{' '}
              <strong className="text-rose-950">Registre sua reclamação</strong> pelo
              botão abaixo.
            </p>

            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-bold leading-snug text-amber-900">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {SITE_CONFIG.supportNote}
            </p>

            <a
              href={whatsappOrderUrl(SITE_CONFIG.supportWhatsMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-800 px-4 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700"
            >
              <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Registrar reclamação
            </a>

            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-stone-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
              Sua compra está protegida — garantia de 7 dias
            </p>
          </div>
        </div>
      )}

      {/* botão flutuante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Abrir suporte"
        title="Suporte ao cliente"
        className="fixed bottom-[5.25rem] right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-rose-800 text-white shadow-xl shadow-rose-950/50 transition-all duration-300 hover:scale-105 hover:from-rose-500 hover:to-rose-700 lg:bottom-8 sm:right-6"
      >
        <Headset className="h-5 w-5" aria-hidden="true" />
      </button>
    </>
  )
}
