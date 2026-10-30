import type { NextConfig } from "next";

/**
 * 🥷 Configuração de produção "anti-curioso":
 * - minificação + embaralhamento de nomes (padrão do Next/SWC)
 * - console.* do NAVEGADOR removido no build (menos pistas, console limpo)
 * - sem source maps no navegador (impossível ver o código original)
 * - sem header X-Powered-By (não revela a tecnologia do site)
 */
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // 🕵️ nada de mapa do código original para o navegador baixar
  productionBrowserSourceMaps: false,
  // 🚫 não anuncia "X-Powered-By: Next.js" nas respostas
  poweredByHeader: false,
  // 🤫 no navegador, apaga console.log/debug/info do build (erros continuam)
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  // 🛡️ Cabeçalhos de segurança para todo o site
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // CSP enxuta: não quebra nada e bloqueia objetos embutidos,
            // sequestro de <base> e exibição do site dentro de iframe alheio
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self' https://wa.me",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
