#!/bin/bash
# Tenta criar as tabelas do banco antes do build na Vercel (opcional).
# Se falhar, NÃO quebra o build: o app tem autocura em tempo de execução (db.ts).
DB="${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-$DATABASE_URL}}"
if [ -z "$DB" ]; then
  echo "[db] sem variável de banco — pulando (app fará autocura no 1º acesso)"
  exit 0
fi

case "$DB" in
  postgresql://*|postgres://*) ;;
  *)
    echo "[db] variável de banco não é Postgres — pulando"
    exit 0
    ;;
esac

case "$DB" in
  *\?*) export DATABASE_URL="$DB&connect_timeout=10" ;;
  *)    export DATABASE_URL="$DB?connect_timeout=10" ;;
esac

echo "[db] host: $(echo "$DATABASE_URL" | sed 's|.*@||; s|/.*||')"
if timeout 60 npx prisma db push --accept-data-loss --skip-generate; then
  echo "[db] tabelas criadas/verificadas ✔"
else
  echo "[db] aviso: db push não rodoi — o app cria as tabelas sozinho no 1º acesso (autocura)"
fi
exit 0
