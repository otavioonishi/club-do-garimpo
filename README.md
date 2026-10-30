# 🎄 Club do Garimpo — Loja da Árvore de Natal 2m

Landing page de vendas com checkout completo e pagamento via **Pix (MisticPay)**.

> **Árvore de Natal 2 metros com 54 enfeites** · de ~~R$ 260~~ por **R$ 80** (69% OFF)
> Adicional opcional: **Kit Luzinhas +R$ 20**

⚠️ **Mantenha este repositório PRIVADO** — ele contém a configuração de acesso do painel de pedidos.

## 🧪 Stack

- Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui
- Prisma + SQLite
- Pix via API da MisticPay (QR Code + copia-e-cola + confirmação automática)

## 💻 Rodar local

```bash
npm install
cp .env.example .env   # preencha as chaves da MisticPay
npx prisma db push     # cria o banco
npm run dev            # http://localhost:3000
```

## 🔐 Painel de pedidos

Abra o site com `#pedidos` no final do link (ex.: `seusite.com.br/#pedidos`),
entre com o **e-mail e senha** configurados em `src/config.ts`
(`adminEmail` / `adminPin`). Lá você vê todos os pedidos, endereços,
status do Pix (atualiza sozinho a cada 20s) e marca como **enviado**.

## 🚀 Deploy no Render

O projeto já vem com o blueprint pronto (`render.yaml`):

1. Suba este repositório no GitHub (**privado!**)
2. No [dashboard.render.com](https://dashboard.render.com): **New + → Blueprint** → escolha o repositório
3. Preencha as variáveis marcadas:
   - `MISTICPAY_CLIENT_ID` — sua chave `pk_`
   - `MISTICPAY_CLIENT_SECRET` — sua chave `sk_`
   - `APP_PUBLIC_URL` — `https://NOME-DO-SERVIÇO.onrender.com`
4. Clique em **Apply** e aguarde o build (~5 min)

### Depois do primeiro deploy

- 🔔 Cadastre o webhook na MisticPay (painel → API → Webhooks):
  `https://NOME-DO-SERVIÇO.onrender.com/api/webhooks/misticpay`
- 💾 O plano **Starter** inclui o disco persistente (`/var/data`), onde o
  banco SQLite guarda os pedidos com segurança entre deploys.
- 😴 Instância parada "dorme" após 15 min sem acesso (cold start de ~50s no
  próximo visitante — comum em todos os hosts com plano econômico).

### Por que o plano free não serve (com banco SQLite)?

No plano free o Render **não permite disco persistente**: a cada deploy ou
restart o arquivo do banco é apagado e os pedidos se perdem. O blueprint já
sai configurado com `starter` + disco de 1 GB.
