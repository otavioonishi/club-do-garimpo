/**
 * ⚙️ CONFIGURAÇÃO DO SITE — edite aqui para personalizar
 *
 * 1. whatsappGroupUrl: link do seu Grupo VIP no WhatsApp
 *    (No WhatsApp: Grupo > Convidar via link > copie e cole aqui)
 *
 * 2. whatsappNumber: seu número com DDI (55) + DDD + número
 *    Ex.: 5511987654321
 */
export const SITE_CONFIG = {
  brand: "Club do Garimpo",
  productName: "Árvore de Natal 2m com 54 Enfeites",
  oldPrice: "R$ 260,00",
  price: "R$ 80,00",
  priceValue: 80,
  installments: "Pagamento no Pix · aprovação na hora · frete combinado no WhatsApp",
  discount: "69% OFF",
  stockRemaining: 23,
  stockTotal: 120,

  // 💡 Kit Luzinhas — adicional de R$ 20 que o cliente pode acrescentar no pedido
  // (vem junto na caixa com as bolinhas de enfeite)
  lightsKitPrice: 20,

  // 🔐 Login do painel de pedidos — abra o site com #pedidos no final do link
  // As credenciais agora ficam nas variáveis de ambiente da Vercel
  // (ADMIN_EMAIL e ADMIN_PIN) e são validadas só no servidor —
  // nada de senha aparece no navegador/inspetor.

  // 🎧 Suporte — texto exibido no botão de suporte e na mensagem enviada
  supportNote:
    "Respondemos em até 72 horas após o registro da sua reclamação.",
  supportWhatsMessage: `Olá! 🎧 Quero registrar uma reclamação / falar com o suporte sobre meu pedido no Club do Garimpo.`,

  // 🔗 SUBSTITUA PELOS SEUS LINKS REAIS
  whatsappGroupUrl: "https://chat.whatsapp.com/SEU-LINK-AQUI",
  whatsappNumber: "5511999999999",
} as const;

/** Gera um link wa.me com mensagem pré-preenchida */
export function whatsappOrderUrl(message: string): string {
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const ORDER_MESSAGE =
  `Olá! 🎄 Quero aproveitar a oferta da *Árvore de Natal 2m com 54 Enfeites* por R$ 80,00 (de R$ 260,00). Quero pagar no Pix — pode me enviar a chave e o prazo de entrega?`;
