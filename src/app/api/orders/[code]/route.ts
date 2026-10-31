import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isValidCpf } from "@/lib/cpf";

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
        customerFirstName: (order.customerName ?? "Cliente").split(" ")[0],
        hasAddress: Boolean(order.street && order.city && order.state),
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

/* ------------------------------------------------------------------ */
/* ✍️ Dados de entrega — o cliente preenche DEPOIS de pagar            */
/* ------------------------------------------------------------------ */

const deliverySchema = z.object({
  customerName: z.string().trim().min(3, "Nome muito curto").max(120),
  cpf: z.string().refine((v) => isValidCpf(v), { message: "CPF inválido" }),
  phone: z.string().min(10, "Telefone incompleto").max(20),
  cep: z.string().min(8).max(9),
  street: z.string().trim().min(2).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(200).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().length(2),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const clean = code.trim().toUpperCase();

    const parsed = deliverySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Confira os campos do endereço.",
          issues: parsed.error.issues.map((i) => ({
            campo: i.path.join("."),
            problema: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const existing = await db.order.findUnique({ where: { code: clean } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    // só aceita dados de entrega enquanto o pedido aguarda envio
    if (!["aguardando_pagamento", "pago"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Este pedido já está a caminho — fale com a gente pelo WhatsApp." },
        { status: 409 }
      );
    }

    const data = parsed.data;
    const order = await db.order.update({
      where: { code: clean },
      data: {
        customerName: data.customerName,
        cpf: data.cpf.replace(/\D/g, ""),
        phone: data.phone,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement?.trim() || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state.toUpperCase(),
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        code: order.code,
        status: order.status,
        totalValue: order.totalValue,
        customerFirstName: (order.customerName ?? "Cliente").split(" ")[0],
      },
    });
  } catch (err) {
    console.error("[api/orders/:code] erro ao salvar dados de entrega:", err);
    return NextResponse.json(
      { error: "Não foi possível salvar o endereço agora. Tente de novo." },
      { status: 500 }
    );
  }
}
