import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * 🚚 Rastreio público do pedido — GET /api/orders/CODIGO
 *
 * Rota usada pela página /pedido/CODIGO que o cliente abre depois de comprar.
 * Retorna SOMENTE dados seguros (sem endereço completo, telefone ou CPF) —
 * quem tiver o código do pedido consegue acompanhar o envio.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const clean = code.trim().toUpperCase();

    const order = await db.order.findUnique({ where: { code: clean } });
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado. Confira o código." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      order: {
        code: order.code,
        status: order.status,
        quantity: order.quantity,
        lightsKit: order.lightsKit,
        totalValue: order.totalValue,
        customerFirstName: order.customerName.split(" ")[0],
        city: order.city,
        state: order.state,
        // 🚚 envio e prazo
        deliveryDays: order.deliveryDays,
        deliveryNote: order.deliveryNote,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("[api/orders/:code] erro no rastreio:", err);
    return NextResponse.json(
      { error: "Não foi possível carregar o pedido agora." },
      { status: 500 }
    );
  }
}
