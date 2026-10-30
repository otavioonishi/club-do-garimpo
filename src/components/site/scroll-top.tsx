'use client'

import { useEffect } from 'react'

/**
 * Garante que o site abra sempre na tela inicial (a foto da árvore).
 * Alguns celulares reabrem o link na posição anterior (restauração de
 * rolagem do navegador) — aqui a gente desliga isso e volta ao topo.
 */
export default function ScrollTop() {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  return null
}
