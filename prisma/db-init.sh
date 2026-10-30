#!/bin/bash
# Cria as tabelas do banco (prisma db push) antes do build na Vercel.
# Aceita: Supabase (POSTGRES_PRISMA_URL / POSTGRES_URL), Neon ou DATABASE_URL.
DB="${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-$DATABASE_URL}}"
if [ -z "$DB" ]; then
  echo "[db] sem variável de banco — pulando db push"
  exit 0
fi

case "$DB" in
  postgresql://*|postgres://*) ;;
  *)
    echo "[db] variável de banco não é Postgres — pulando db push"
    exit 0
    ;;
esac

# timeout de conexão (falha em ~10s em vez de travar o build)
case "$DB" in
  *\?*) export DATABASE_URL="$DB&connect_timeout=10" ;;
  *)    export DATABASE_URL="$DB?connect_timeout=10" ;;
esac

echo "[db] host: $(echo "$DATABASE_URL" | sed 's|.*@||; s|/.*||')"
npx prisma db push --accept-data-loss --skip-generate || exit 1
echo "[db] tabelas criadas/verificadas com sucesso"
