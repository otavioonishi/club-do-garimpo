import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { SITE_CONFIG } from "@/config";
import { generatePlaceholderCpf } from "@/lib/cpf";
import {
  createDemoCharge,
  createPixCharge,
  isConfigured,
  isDemoMode,
} from "@/lib/misticpay";
import { pinOk } from "@/lib/admin-auth";

/**
 * 💳 Fluxo "Pix primeiro": a pessoa clica em Comprar e o QR Code aparece na
 * hora, ANTES de qualquer formulário. O pedido nasce sem dados do cliente
 * (nome/contato/endereço entram depois, PATCH /api/orders/[code], já pago).
 */

const orderSchema = z.object({
  quantity: z.number().int().min(1).max(20).default(1),
  lightsKit: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const patchSchema = z.object({
  code: z.string().min(4).max(20),
  status: z.enum(["novo", "aguardando_pagamento", "pago", "enviado", "entregue"]),
  deliveryDays: z.number().int().min(1).max(90).optional(),
  deliveryNote: z.string().max(200).optional().or(z.literal("")),
});

/** Painel admin: exige e-mail + senha nos headers (validação no servidor). */

/** 🚦 Rate limit em memória (por instância): máx. 10 pedidos/10min por IP.
 *  Como agora qualquer clique cria pedido + cobrança Pix, isso segura bots
 *  curiosos sem atrapalhar cliente de verdade. */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10_000) hits.clear(); // evita crescimento infinito
  return false;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || "desconhecido";
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
    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        { error: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados do pedido inválidos." },
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
        quantity: data.quantity,
        lightsKit: data.lightsKit,
        paymentMethod: "pix",
        notes: data.notes?.trim() || null,
        totalValue,
        status: "novo",
      },
    });

    /* 💳 gera a cobrança Pix NA HORA, sem pedir nada ao cliente.
       O gateway exige nome + CPF de pagador — usamos um provisório,
       porque quem paga é o próprio banco da pessoa. ------------------ */
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
          payerName: "Cliente Club do Garimpo",
          payerDocument: generatePlaceholderCpf(),
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
