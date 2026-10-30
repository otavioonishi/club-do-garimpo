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
status do Pix (atualiza sozinho a cada 20s), marca como **enviado** e
define o **prazo de entrega** (dias) de cada pedido.

O cliente acompanha o envio na página pública `site.com.br/pedido/CODIGO`
(ex.: `/pedido/CG-AB12CD34`) — mostra pagamento confirmado, a caminho,
entregue e a previsão de chegada. O link aparece na tela de sucesso do
checkout e pode ser enviado pelo WhatsApp quando perguntarem.

## 🚀 Deploy no Render

O projeto já vem com o blueprint pronto (`render.yaml`).

> ⚡ **O site vai pré-compilado no GitHub** (pasta `.next/standalone`).
> O plano FREE do Render tem 512 MB de RAM e o `next build` precisa de
> ~1 GB — por isso o servidor **não builda nada**, só roda o código pronto.
> Sempre que mudar o site, rode `npm run build` antes de subir o commit.

1. Suba este repositório no GitHub (**privado!**)
2. No [dashboard.render.com](https://dashboard.render.com): **New + → Blueprint** → escolha o repositório
3. Preencha as variáveis marcadas:
   - `MISTICPAY_CLIENT_ID` — sua chave `pk_`
   - `MISTICPAY_CLIENT_SECRET` — sua chave `sk_`
   - `APP_PUBLIC_URL` — `https://NOME-DO-SERVIÇO.onrender.com`
4. Clique em **Apply** e aguarde o deploy (~3 min)

### Serviço já criado dando erro 502?

É o build estourando a memória do plano FREE. No painel do serviço:
**Settings → Build & Deploy** e troque:

- **Build Command:** `echo "site pre-compilado"`
- **Start Command:** `npm start`

Salve e clique em **Manual Deploy → Deploy latest commit**.

### Depois do primeiro deploy

- 🔔 Cadastre o webhook na MisticPay (painel → API → Webhooks):
  `https://NOME-DO-SERVIÇO.onrender.com/api/webhooks/misticpay`
- 😴 No plano **free** a instância "dorme" após 15 min sem acesso (cold start
  de ~50s no próximo visitante) e o banco SQLite fica em `/tmp` — o histórico
  de pedidos se perde a cada **deploy** (restart mantém). Atenda cada pedido
  pelo WhatsApp.

### Quer pedidos permanentes e site 24h? (plano Starter)

No painel do Render: **Settings → Change Instance Type → Starter** e
**Advanced → Add Disk** (nome `sqlite-data`, caminho `/var/data`, 1 GB) e
troque a variável `DATABASE_URL` para `file:/var/data/custom.db`.
A partir daí os pedidos sobrevivem a deploys e o site fica ligado 24h.
