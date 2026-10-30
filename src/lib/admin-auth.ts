/**
 * 🔐 Autenticação do painel de pedidos — SOMENTE NO SERVIDOR.
 *
 * As credenciais moram nas variáveis de ambiente ADMIN_EMAIL e ADMIN_PIN
 * (configure na Vercel: Settings → Environment Variables). Assim elas nunca
 * vão para o navegador — o inspetor não mostra nada.
 *
 * ⚠️ NUNCA importar este arquivo em componente client ('use client').
 */

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export function adminPin(): string {
  return (process.env.ADMIN_PIN ?? "").trim();
}

/** Credenciais do painel configuradas no servidor? */
export function isAdminConfigured(): boolean {
  return adminEmail() !== "" && adminPin() !== "";
}

/** Confere os headers x-admin-email / x-admin-pin da requisição. */
export function pinOk(req: Request): boolean {
  if (!isAdminConfigured()) return false;
  const email = (req.headers.get("x-admin-email") ?? "").trim().toLowerCase();
  const pin = (req.headers.get("x-admin-pin") ?? "").trim();
  return email === adminEmail() && pin === adminPin();
}
