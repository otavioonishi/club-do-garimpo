# 🎄 Club do Garimpo — Loja da Árvore de Natal 2m

Landing page de vendas com checkout completo e pagamento via **Pix (MisticPay)**.

> **Árvore de Natal 2 metros com 54 enfeites** · de ~~R$ 260~~ por **R$ 80** (69% OFF)
> Adicional opcional: **Kit Luzinhas +R$ 20**

⚠️ **Mantenha este repositório PRIVADO** — ele contém a configuração de acesso do painel de pedidos.

## 🧪 Stack

- Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui
- Prisma + **PostgreSQL** (Vercel Postgres/Neon — pedidos permanentes, nunca se perdem)
- Pix via API da MisticPay (QR Code + copia-e-cola + confirmação automática)

## 💻 Rodar local

```bash
npm install           # roda prisma generate sozinho (postinstall)
# .env com DATABASE_URL (Postgres) e as chaves da MisticPay
npx prisma db push    # cria as tabelas
npm run dev           # http://localhost:3000
```

## 🔐 Painel de pedidos

Abra o site com `#pedidos` no final do link (ex.: `seusite.com.br/#pedidos`),
entre com o **e-mail e senha** configurados em `src/config.ts`
(`adminEmail` / `adminPin`). Lá você vê todos os pedidos, endereços,
status do Pix (atualiza sozinho a cada 20s), marca como **enviado** e
define o **prazo de entrega** (dias) de cada pedido.

O cliente acompanha o envio na página pública `site.com.br/pedido/CODIGO`
(ex.: `/pedido/CG-AB12CD34`) — mostra pagamento confirmado, a caminho,
entregue e a previsão de chegada. O link aparece na tela de sucesso do
checkout e pode ser enviado pelo WhatsApp quando perguntarem.

## 🚀 Deploy na Vercel (grátis, sem cartão)

1. Entre em [vercel.com](https://vercel.com) → **Sign Up → Continue with GitHub** (autorize a Vercel)
2. **Add New… → Project** → ache o repositório `club-do-garimpo` → **Import**
3. Na tela de configuração, antes de apertar Deploy, abra **Environment Variables** e adicione:
   - `MISTICPAY_CLIENT_ID` = sua chave `pk_`
   - `MISTICPAY_CLIENT_SECRET` = sua chave `sk_`
   - `APP_PUBLIC_URL` = `https://club-do-garimpo.vercel.app` (confirme o domínio exato depois)
4. **Deploy** (~2–3 min — o build roda na nuvem da Vercel, sem limite de memória)
5. Crie o banco: no projeto, aba **Storage** → **Create Database → Postgres (Neon)**
   → plano **Hobby (free)** → **Connect to Project** → selecione `club-do-garimpo`
   → a Vercel cria a `DATABASE_URL` sozinha e **redeploya**
6. Pronto — na nova build o `vercel.json` já roda `prisma db push` e cria as tabelas dos pedidos

> ℹ️ Se o primeiro deploy ficar sem banco, as páginas funcionam mas o checkout
> reclama — é só conectar o Postgres no passo 5 e o redeploy resolve tudo.

### Depois do deploy

- 🔔 Cadastre o webhook na MisticPay (painel → API → Webhooks):
  `https://SEU-DOMINIO.vercel.app/api/webhooks/misticpay`
- 🔗 Atualize `APP_PUBLIC_URL` nas Environment Variables com o domínio exato
  que a Vercel atribuiu (ex.: `https://club-do-garimpo-xyz.vercel.app`) e redeploy
- 🌎 Quer domínio próprio? **Settings → Domains** (grátis também)

O build roda `prisma db push` a cada deploy (`vercel.json`), então o banco
sempre fica no formato certo do schema — e os pedidos ficam salvos
permanentemente no Postgres, não se perdem em deploy algum.
