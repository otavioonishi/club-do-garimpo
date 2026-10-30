import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkDemoCharge, checkTransaction, isConfigured, isDemoMode } from "@/lib/misticpay";

/**
 * Estado do Pix de um pedido — usado pela tela de pagamento do checkout
 * para descobrir sozinha quando o cliente pagou (polling a cada 5s).
 * GET /api/payments/status?code=CG-XXXX
 */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Código do pedido obrigatório." }, { status: 400 });
  }

  try {
    const order = await db.order.findUnique({ where: { code } });
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    if (order.status !== "aguardando_pagamento") {
      return NextResponse.json({ status: order.status, demo: false });
    }

    /* ainda aguardando — pergunta na fonte ------------------------------ */
    let state: "PENDENTE" | "COMPLETO" | "FALHA" = "PENDENTE";
    let demo = false;

    if (order.pixTransactionId?.startsWith("demo_") && isDemoMode()) {
      state = checkDemoCharge(order.createdAt);
      demo = true;
    } else if (isConfigured() && order.pixTransactionId) {
      try {
        state = await checkTransaction(order.pixTransactionId);
      } catch (err) {
        console.error("[api/payments/status] check falhou (mantém pendente):", err);
      }
    }

    if (state === "COMPLETO") {
      await db.order.update({
        where: { code },
        data: { status: "pago", paidAt: new Date() },
      });
      return NextResponse.json({ status: "pago", demo });
    }

    return NextResponse.json({ status: "aguardando_pagamento", demo });
  } catch (err) {
    console.error("[api/payments/status] erro:", err);
    return NextResponse.json({ error: "Erro ao consultar pagamento." }, { status: 500 });
  }
}
