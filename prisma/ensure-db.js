/**
 * 🗄️ Prepara o banco SQLite antes de subir o site (roda no Render).
 *
 * No plano FREE o banco fica em /tmp e se perde a cada deploy — este script
 * copia o banco inicial vazio (prisma/render-init.db, já com as tabelas) para
 * o caminho do DATABASE_URL SOMENTE se ainda não existir. Assim os pedidos
 * sobrevivem a restarts e cada deploy recomeça com um banco limpo.
 *
 * Equivalente a: cp -n prisma/render-init.db /tmp/custom.db
 */
const fs = require("fs");
const path = require("path");

const dst =
  (process.env.DATABASE_URL || "").replace(/^file:/, "").trim() ||
  "/tmp/custom.db";
const src = path.join(__dirname, "render-init.db");

try {
  if (fs.existsSync(dst)) {
    console.log(`[db] banco existente mantido: ${dst}`);
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`[db] banco inicial criado: ${dst}`);
  }
} catch (err) {
  console.error("[db] falha ao preparar o banco:", err);
  process.exit(1);
}
