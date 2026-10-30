/**
 * 💳 Cliente da API da MisticPay (docs.misticpay.com) — SOMENTE NO SERVIDOR.
 *
 * Autenticação: Basic (client_id : client_secret), chaves geradas no painel
 * deles em API → Chaves de Acesso. Configuração em .env:
 *   MISTICPAY_CLIENT_ID / MISTICPAY_CLIENT_SECRET / MISTICPAY_DEMO
 *
 * Modo demonstração: sem chaves + MISTICPAY_DEMO=true → gera um Pix de
 * exemplo (QR visível na tela, aprova sozinho em ~15s) para testar o fluxo
 * antes de cadastrar as chaves reais. Nunca ativo quando há chaves reais.
 */
import { randomUUID } from "crypto";

const API_BASE =
  process.env.MISTICPAY_API_URL?.trim().replace(/\/$/, "") ||
  "https://api.misticpay.com/api";

export type PixCharge = {
  providerId: string; // transactionId retornado pela MisticPay
  copyPaste: string; // código Pix copia e cola
  qrBase64: string | null; // imagem do QR (data:image/png;base64,…)
};

export type ChargeState = "PENDENTE" | "COMPLETO" | "FALHA";

export function clientId(): string {
  return process.env.MISTICPAY_CLIENT_ID?.trim() ?? "";
}

export function clientSecret(): string {
  return process.env.MISTICPAY_CLIENT_SECRET?.trim() ?? "";
}

/** Chaves reais configuradas? */
export function isConfigured(): boolean {
  return clientId() !== "" && clientSecret() !== "";
}

/** Modo demonstração (sem chaves reais). */
export function isDemoMode(): boolean {
  return !isConfigured() && process.env.MISTICPAY_DEMO === "true";
}

/* ------------------------------------------------------------------ */
/* Cobrança real                                                       */
/* ------------------------------------------------------------------ */

async function authHeader(): Promise<string> {
  const basic = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
  return `Basic ${basic}`;
}

/**
 * Cria a cobrança Pix na MisticPay.
 * amount em reais (ex.: 80), payerDocument = CPF só dígitos.
 */
export async function createPixCharge(opts: {
  amount: number;
  payerName: string;
  payerDocument: string;
  reference: string; // nosso código de pedido (CG-XXXX)
  description: string;
  webhookUrl?: string;
}): Promise<PixCharge> {
  const res = await fetch(`${API_BASE}/transactions/create`, {
    method: "POST",
    headers: {
      Authorization: await authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amount,
      payerName: opts.payerName,
      payerDocument: opts.payerDocument,
      transactionId: opts.reference,
      description: opts.description,
      ...(opts.webhookUrl ? { projectWebhook: opts.webhookUrl } : {}),
    }),
    // cobrança Pix não pode demorar mais que isso na hora do checkout
    signal: AbortSignal.timeout(15000),
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: { transactionId?: string; copyPaste?: string; qrCodeBase64?: string }; message?: string }
    | null;

  if (!res.ok || !json?.data?.copyPaste) {
    const msg = json?.message ?? `HTTP ${res.status}`;
    throw new Error(`MisticPay create falhou: ${msg}`);
  }

  return {
    providerId: String(json.data.transactionId ?? opts.reference),
    copyPaste: json.data.copyPaste,
    qrBase64: json.data.qrCodeBase64 ?? null,
  };
}

/** Consulta o estado da transação na MisticPay. */
export async function checkTransaction(providerId: string): Promise<ChargeState> {
  const res = await fetch(`${API_BASE}/transactions/check`, {
    method: "POST",
    headers: {
      Authorization: await authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactionId: providerId }),
    signal: AbortSignal.timeout(10000),
  });

  const json = (await res.json().catch(() => null)) as
    | { transaction?: { transactionState?: string } }
    | null;

  const state = json?.transaction?.transactionState?.toUpperCase();
  if (state === "COMPLETO") return "COMPLETO";
  if (state === "FALHA" || state === "CANCELADO" || state === "DEVOLVIDO") return "FALHA";
  return "PENDENTE";
}

/* ------------------------------------------------------------------ */
/* Modo demonstração (sem chaves reais)                                */
/* ------------------------------------------------------------------ */

/** Gera um Pix de exemplo só para exibição (QR de verdade, mas não pagável). */
export async function createDemoCharge(opts: {
  amount: number;
  reference: string;
}): Promise<PixCharge> {
  const { default: QRCode } = await import("qrcode");

  const payload =
    `00020126MISTICPAY-DEMO5204000053039865802BR` +
    `5914CLUB DO GARIMPO6009SAO PAULO` +
    `62${String(10 + opts.reference.length).padStart(2, "0")}05${opts.reference}` +
    `54${String(opts.amount.toFixed(2).length).padStart(2, "0")}${opts.amount.toFixed(2)}` +
    `6304${randomUUID().slice(0, 4).toUpperCase()}`;

  const qrDataUrl = await QRCode.toDataURL(payload, {
    margin: 1,
    width: 480,
    color: { dark: "#1c0a12", light: "#ffffff" },
  });

  return { providerId: `demo_${randomUUID()}`, copyPaste: payload, qrBase64: qrDataUrl };
}

/** Estado da cobrança demo: aprova sozinho após 15 segundos. */
export function checkDemoCharge(orderCreatedAt: Date): ChargeState {
  return Date.now() - orderCreatedAt.getTime() > 15000 ? "COMPLETO" : "PENDENTE";
}
