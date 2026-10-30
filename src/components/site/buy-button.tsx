'use client'

import { useState } from 'react'
import CheckoutDialog from './checkout-dialog'

/**
 * Botão de compra — abre o formulário de checkout.
 * Aceita as mesmas classes de estilo dos CTAs da página.
 */
export default function BuyButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <CheckoutDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
