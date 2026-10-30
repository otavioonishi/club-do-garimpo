import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { SITE_CONFIG } from "@/config";
import { isValidCpf } from "@/lib/cpf";
import {
  createDemoCharge,
  createPixCharge,
  isConfigured,
  isDemoMode,
} from "@/lib/misticpay";

const orderSchema = z.object({
  customerName: z.string().min(3).max(120),
  cpf: z
    .string()
    .refine((v) => isValidCpf(v), { message: "CPF inválido" }),
  phone: z.string().min(10).max(20),
  cep: z.string().min(8).max(9),
  street: z.string().min(2).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(200).optional().or(z.literal("")),
  neighborhood: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  state: z.string().length(2),
  quantity: z.number().int().min(1).max(20),
  lightsKit: z.boolean().default(false),
  paymentMethod: z.enum(["pix"]).default("pix"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const patchSchema = z.object({
  code: z.string().min(4).max(20),
  status: z.enum(["novo", "aguardando_pagamento", "pago", "enviado", "entregue"]),
  deliveryDays: z.number().int().min(1).max(90).optional(),
  deliveryNote: z.string().max(200).optional().or(z.literal("")),
});

/** Painel admin: exige e-mail + senha nos headers */
function pinOk(req: Request): boolean {
  return (
    req.headers.get("x-admin-pin") === SITE_CONFIG.adminPin &&
    (req.headers.get("x-admin-email") ?? "").trim().toLowerCase() ===
      SITE_CONFIG.adminEmail.toLowerCase()
  );
}

export async function GET(req: Request) {
  if (!pinOk(req)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    console.error("[api/orders] erro ao listar pedidos:", err);
    return NextResponse.json(
      { error: "Não foi possível carregar os pedidos." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!pinOk(req)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }
  try {
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos para atualizar o pedido." },
        { status: 400 }
      );
    }
    const { code, status, deliveryDays, deliveryNote } = parsed.data;

    const existing = await db.order.findUnique({ where: { code } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const data: {
      status: string;
      deliveryDays?: number;
      deliveryNote?: string | null;
      shippedAt?: Date | null;
      deliveredAt?: Date | null;
    } = { status };
    if (deliveryDays !== undefined) data.deliveryDays = deliveryDays;
    if (deliveryNote !== undefined) data.deliveryNote = deliveryNote.trim() || null;

    // 🚚 datas de envio/entrega automáticas
    if (status === "enviado") {
      data.shippedAt = existing.shippedAt ?? new Date();
      data.deliveredAt = null;
    } else if (status === "entregue") {
      data.shippedAt = existing.shippedAt ?? new Date();
      data.deliveredAt = new Date();
    } else {
      data.shippedAt = null;
      data.deliveredAt = null;
    }

    const order = await db.order.update({ where: { code }, data });
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("[api/orders] erro ao atualizar pedido:", err);
    return NextResponse.json(
      { error: "Não foi possível atualizar o pedido." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados do formulário inválidos. Confira os campos e tente novamente.",
          issues: parsed.error.issues.map((i) => ({
            campo: i.path.join("."),
            problema: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const code = `CG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const totalValue =
      data.quantity * SITE_CONFIG.priceValue +
      (data.lightsKit ? SITE_CONFIG.lightsKitPrice : 0);

    const order = await db.order.create({
      data: {
        code,
        customerName: data.customerName.trim(),
        cpf: data.cpf.replace(/\D/g, ""),
        phone: data.phone,
        cep: data.cep,
        street: data.street.trim(),
        number: data.number.trim(),
        complement: data.complement?.trim() || null,
        neighborhood: data.neighborhood.trim(),
        city: data.city.trim(),
        state: data.state.toUpperCase(),
        quantity: data.quantity,
        lightsKit: data.lightsKit,
        paymentMethod: data.paymentMethod,
        notes: data.notes?.trim() || null,
        totalValue,
        status: "novo",
      },
    });

    /* 💳 gera a cobrança Pix na hora (MisticPay) ------------------------ */
    let payment: {
      available: boolean;
      demo: boolean;
      copyPaste?: string;
      qrBase64?: string | null;
      reason?: string;
    } = { available: false, demo: false, reason: "indisponível" };

    try {
      if (isConfigured()) {
        const base = process.env.APP_PUBLIC_URL?.trim().replace(/\/$/, "");
        const charge = await createPixCharge({
          amount: totalValue,
          payerName: data.customerName.trim(),
          payerDocument: data.cpf.replace(/\D/g, ""),
          reference: code,
          description: `Pedido ${code} — ${SITE_CONFIG.productName}`,
          webhookUrl: base ? `${base}/api/webhooks/misticpay` : undefined,
        });
        await db.order.update({
          where: { code },
          data: {
            pixTransactionId: charge.providerId,
            pixCopyPaste: charge.copyPaste,
            status: "aguardando_pagamento",
          },
        });
        payment = {
          available: true,
          demo: false,
          copyPaste: charge.copyPaste,
          qrBase64: charge.qrBase64,
        };
      } else if (isDemoMode()) {
        const charge = await createDemoCharge({ amount: totalValue, reference: code });
        await db.order.update({
          where: { code },
          data: {
            pixTransactionId: charge.providerId,
            pixCopyPaste: charge.copyPaste,
            status: "aguardando_pagamento",
          },
        });
        payment = {
          available: true,
          demo: true,
          copyPaste: charge.copyPaste,
          qrBase64: charge.qrBase64,
        };
      } else {
        payment = {
          available: false,
          demo: false,
          reason: "chaves MisticPay ausentes nas variáveis de ambiente",
        };
      }
    } catch (pixErr) {
      // Pix não saiu — o pedido continua salvo e a chave vai pelo WhatsApp
      console.error("[api/orders] falha ao gerar Pix, cai no WhatsApp:", pixErr);
      payment = {
        available: false,
        demo: false,
        reason: `erro MisticPay: ${
          pixErr instanceof Error ? pixErr.message : String(pixErr)
        }`,
      };
    }

    return NextResponse.json(
      {
        ok: true,
        order: {
          code,
          quantity: data.quantity,
          totalValue,
          customerName: data.customerName.trim(),
          paymentMethod: "pix",
          lightsKit: data.lightsKit,
        },
        payment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/orders] erro ao criar pedido:", err);
    return NextResponse.json(
      { error: "Não foi possível registrar seu pedido agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
