'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import BuyButton from './buy-button'
import { SITE_CONFIG } from '@/config'

/**
 * 💰 Barra fixa de compra no celular — garante que o botão esteja
 * sempre à mão DURANTE a rolagem. Mas ela só aparece depois que a
 * pessoa começa a rolar: na abertura do site, quem chama a atenção
 * é a árvore inteira, não a barra.
 */
export default function StickyBuyBar() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 140)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-rose-200 bg-white/95 shadow-[0_-8px_24px_rgba(80,10,30,0.12)] backdrop-blur transition-transform duration-300 lg:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="leading-tight">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500">
            <span className="line-through">{SITE_CONFIG.oldPrice}</span>
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
              {SITE_CONFIG.discount}
            </span>
          </p>
          <p className="text-xl font-black text-rose-700">{SITE_CONFIG.price}</p>
        </div>
        <BuyButton className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-800 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700">
          <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
          Comprar agora
        </BuyButton>
      </div>
    </div>
  )
}
