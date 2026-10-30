import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Great_Vibes, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ScrollTop from "@/components/site/scroll-top";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const vibes = Great_Vibes({
  variable: "--font-vibes",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://clubdogarimpo.example.com"),
  title: "Árvore de Natal 2m com 54 Enfeites | De R$260 por R$80 — Club do Garimpo",
  description:
    "Árvore de Natal de 2 metros com 54 enfeites inclusos, montagem fácil e visual premium. De R$ 260,00 por apenas R$ 80,00. Envio rápido e compra 100% segura. Entre no Grupo VIP grátis!",
  keywords: [
    "árvore de natal",
    "árvore de natal 2 metros",
    "árvore com enfeites",
    "natal barato",
    "club do garimpo",
    "grupo vip whatsapp",
    "oferta de natal",
  ],
  openGraph: {
    title: "Árvore de Natal 2m com 54 Enfeites por R$ 80 🔥",
    description:
      "De R$ 260,00 por apenas R$ 80,00. Visual premium, fácil de montar e 54 enfeites inclusos. Entre no Grupo VIP grátis!",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/arvore-hero.png", width: 864, height: 1152, alt: "Árvore de Natal 2m com 54 enfeites" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Árvore de Natal 2m com 54 Enfeites por R$ 80 🔥",
    description: "De R$ 260,00 por apenas R$ 80,00. Entre no Grupo VIP grátis!",
  },
};

export const viewport: Viewport = {
  themeColor: "#2b0a16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${playfair.variable} ${vibes.variable} font-sans antialiased bg-background text-foreground`}>
        {/* Sempre abre no topo — impede o navegador de restaurar a rolagem anterior */}
        <Script id="scroll-topo" strategy="beforeInteractive">
          {"try{if('scrollRestoration' in history){history.scrollRestoration='manual';}window.scrollTo(0,0);}catch(e){}"}
        </Script>
        {children}
        <ScrollTop />
        <Toaster />
      </body>
    </html>
  );
}
