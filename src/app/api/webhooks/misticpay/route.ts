import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkTransaction, isConfigured } from "@/lib/misticpay";

const webhookSchema = z.object({
  transactionId: z.union([z.string(), z.number()]),
  status: z.string().optional(),
});

/**
 * 🔔 Webhook da MisticPay (Webhook de Depósito): chamado por eles quando o
 * Pix cai. Idempotente — pode chegar mais de uma vez.
 * URL a cadastrar no painel: https://SEU-SITE/api/webhooks/misticpay
 *
 * 🔒 SEGURANÇA: o payload do webhook NÃO é confiável (qualquer um poderia
 * POSTar "pagou"). Antes de marcar o pedido como pago, o servidor pergunta
 * direto para a MisticPay (transactions/check, com as chaves secretas) se a
 * transação realmente está COMPLETO. Só aí o pedido vira "pago".
 */
export async function POST(req: Request) {
  try {
    const parsed = webhookSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "payload inválido" }, { status: 400 });
    }

    const providerId = String(parsed.data.transactionId);
    console.warn(`[webhook misticpay] aviso recebido tx=${providerId}`);

    // pedidos de demonstração não têm transação real — ignora
    if (providerId.startsWith("demo_")) {
      return NextResponse.json({ ok: true, matched: false });
    }

    const order = await db.order.findFirst({
      where: { OR: [{ pixTransactionId: providerId }, { code: providerId }] },
    });

    if (!order) {
      console.warn(`[webhook misticpay] nenhum pedido para tx=${providerId}`);
      return NextResponse.json({ ok: true, matched: false });
    }

    if (order.status === "pago") {
      return NextResponse.json({ ok: true, matched: true });
    }

    // 🔒 confirma na fonte (MisticPay) antes de marcar como pago
    if (!isConfigured() || !order.pixTransactionId) {
      console.warn("[webhook misticpay] sem chaves/transação — não marca pago");
      return NextResponse.json({ ok: true, matched: true, verified: false });
    }

    const state = await checkTransaction(order.pixTransactionId);
    if (state === "COMPLETO") {
      await db.order.update({
        where: { code: order.code },
        data: { status: "pago", paidAt: new Date() },
      });
      console.warn(`[webhook misticpay] pedido ${order.code} CONFIRMADO na MisticPay → PAGO`);
    } else {
      console.warn(
        `[webhook misticpay] pedido ${order.code}: MisticPay diz ${state} — segue aguardando`
      );
    }

    return NextResponse.json({ ok: true, matched: true, verified: true });
  } catch (err) {
    console.error("[webhook misticpay] erro:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
