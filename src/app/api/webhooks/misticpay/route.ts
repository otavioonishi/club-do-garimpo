import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const webhookSchema = z.object({
  transactionId: z.union([z.string(), z.number()]),
  status: z.string().optional(),
});

/**
 * 🔔 Webhook da MisticPay (Webhook de Depósito): chamado por eles quando o
 * Pix cai. Idempotente — pode chegar mais de uma vez.
 * URL a cadastrar no painel: https://SEU-SITE/api/webhooks/misticpay
 * (ou deixe vazio — a confirmação continua funcionando por consulta automática)
 */
export async function POST(req: Request) {
  try {
    const parsed = webhookSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "payload inválido" }, { status: 400 });
    }

    const providerId = String(parsed.data.transactionId);
    const status = parsed.data.status?.toUpperCase() ?? "";
    console.log(`[webhook misticpay] tx=${providerId} status=${status}`);

    const order = await db.order.findFirst({
      where: { OR: [{ pixTransactionId: providerId }, { code: providerId }] },
    });

    if (!order) {
      console.warn(`[webhook misticpay] nenhum pedido para tx=${providerId}`);
      return NextResponse.json({ ok: true, matched: false });
    }

    if (status === "COMPLETO" && order.status !== "pago") {
      await db.order.update({
        where: { code: order.code },
        data: { status: "pago", paidAt: new Date() },
      });
      console.log(`[webhook misticpay] pedido ${order.code} marcado como PAGO`);
    }

    return NextResponse.json({ ok: true, matched: true });
  } catch (err) {
    console.error("[webhook misticpay] erro:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
