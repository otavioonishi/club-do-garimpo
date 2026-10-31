import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  tablesReady: Promise<void> | undefined
}

/* 🔌 aceita qualquer padrão de variável de banco:
   Supabase (POSTGRES_PRISMA_URL / POSTGRES_URL), Neon ou DATABASE_URL clássica */
const databaseUrl =
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.DATABASE_URL?.trim()

/* 🛟 autocura: cria a tabela de pedidos no primeiro acesso, se não existir.
   Usa um client próprio (sem extensão) para não criar dependência circular. */
const CREATE_ORDER_SQL = `CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "customerName" TEXT,
  "cpf" TEXT,
  "phone" TEXT,
  "cep" TEXT,
  "street" TEXT,
  "number" TEXT,
  "complement" TEXT,
  "neighborhood" TEXT,
  "city" TEXT,
  "state" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "lightsKit" BOOLEAN NOT NULL DEFAULT false,
  "paymentMethod" TEXT NOT NULL DEFAULT 'pix',
  "notes" TEXT,
  "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 80,
  "status" TEXT NOT NULL DEFAULT 'novo',
  "pixTransactionId" TEXT,
  "pixCopyPaste" TEXT,
  "paidAt" TIMESTAMP(3),
  "deliveryDays" INTEGER,
  "deliveryNote" TEXT,
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
)`

/* 🩹 migração do fluxo "Pix primeiro": o pedido nasce SEM nome/contato/
   endereço (o Pix é emitido antes). Esses ALTERs são idempotentes — rodar
   em coluna já opcional é um no-op, então é seguro em todo cold start. */
const PIX_FIRST_ALTERS = [
  `ALTER TABLE "Order" ALTER COLUMN "customerName" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "phone" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "cep" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "street" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "number" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "neighborhood" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "city" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "state" DROP NOT NULL`,
  `ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'pix'`,
  `ALTER TABLE "Order" ALTER COLUMN "totalValue" SET DEFAULT 80`,
]

async function ensureTables(): Promise<void> {
  if (!databaseUrl?.startsWith('postgres')) return
  const raw = new PrismaClient({ datasourceUrl: databaseUrl })
  try {
    await raw.$executeRawUnsafe(CREATE_ORDER_SQL)
    await raw.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Order_code_key" ON "Order"("code")`
    )
    for (const sql of PIX_FIRST_ALTERS) {
      await raw.$executeRawUnsafe(sql)
    }
    console.warn('[db] ✔ tabela Order verificada/migrada (autocura)')
  } finally {
    await raw.$disconnect().catch(() => {})
  }
}

export const tablesReady: Promise<void> =
  globalForPrisma.tablesReady ??
  ensureTables().catch((err) => {
    console.error(
      '[db] autocura falhou:',
      err instanceof Error ? err.message : err
    )
  })
globalForPrisma.tablesReady = tablesReady

const base =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: databaseUrl })

export const db = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await tablesReady
        return query(args)
      },
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = base
