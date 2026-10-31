import Image from "next/image";
import {
  Truck,
  ShieldCheck,
  BadgeCheck,
  Gift,
  Ruler,
  Sparkles,
  Gem,
  Star,
  Check,
  QrCode,
  Flame,
  TreePine,
  Clock,
  ChevronRight,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { SITE_CONFIG, whatsappOrderUrl } from "@/config";
import Countdown from "@/components/site/countdown";
import SupportButton from "@/components/site/support-button";
import AdminGate from "@/components/site/admin-panel";
import BuyButton from "@/components/site/buy-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ============================ DADOS ============================ */

const MARQUEE_ITEMS = [
  "✨ OFERTA RELÂMPAGO: 69% OFF SÓ HOJE",
  "🎄 54 ENFEITES INCLUSOS",
  "🚚 ENVIO RÁPIDO PARA TODO O BRASIL",
  "🎁 ENTRE NO GRUPO VIP GRÁTIS",
];

const TRUST_ITEMS = [
  { icon: Truck, title: "Envio Rápido", desc: "Postamos em até 24h úteis" },
  { icon: ShieldCheck, title: "Compra Segura", desc: "Seus dados 100% protegidos" },
  { icon: BadgeCheck, title: "Produtos Selecionados", desc: "Qualidade testada e aprovada" },
  { icon: Gift, title: "54 Enfeites Grátis", desc: "Kit completo incluso na caixa" },
];

const BENEFITS = [
  {
    icon: Ruler,
    title: "2 Metros de Altura",
    desc: "Presença imponente para a sala, a recepção ou o seu comércio. Galhos densos e firmes que suportam todos os enfeites com perfeição.",
  },
  {
    icon: Gift,
    title: "54 Enfeites Inclusos",
    desc: "Kit completo com bolas, laços, flocos de neve, pinhas e caixinhas decorativas. Você abre a caixa e decora tudo de uma vez.",
  },
  {
    icon: Sparkles,
    title: "Fácil de Montar",
    desc: "Estrutura inteligente em 3 partes que se encaixam em minutos. Sem ferramentas e sem estresse — é só abrir, montar e brilhar.",
  },
  {
    icon: Gem,
    title: "Visual Premium",
    desc: "Acabamento realista e elegante, com tons de vermelho e dourado, que transforma qualquer ambiente no clima do Natal.",
  },
];

const KIT_ITEMS = [
  "18 bolas vermelhas brilhantes e foscas",
  "12 bolas douradas brilhantes e foscas",
  "8 laços de veludo vermelho",
  "6 flocos de neve dourados",
  "4 pinhas decorativas",
  "4 caixinhas de presente",
  "1 estrela dourada para o topo",
  "1 saia de árvore vermelha",
];

const TESTIMONIALS = [
  {
    name: "Mariana S.",
    city: "São Paulo/SP",
    text: "Montei em 15 minutinhos e ficou LINDA! Os enfeites são de ótima qualidade, nem parece que custou R$ 80. Minha sala virou cenário de filme.",
  },
  {
    name: "Carlos H.",
    city: "Belo Horizonte/MG",
    text: "Comprei desconfiado e me surpreendi. A árvore é bem cheia, os galhos seguram tudo e a montagem é fácil demais. Já indiquei pro grupo da família.",
  },
  {
    name: "Juliana P.",
    city: "Fortaleza/CE",
    text: "Chegou rapidinho e muito bem embalada. O visual premium é real — as fotos nem fazem justiça. Melhor compra do Natal, sem dúvida!",
  },
];

const FAQ_ITEMS = [
  {
    q: "A árvore já vem montada? Como funciona?",
    a: "Ela vem desmontada em 3 partes que se encaixam por encaixe rápido — base, tronco e topo. A montagem leva cerca de 10 minutos, sem nenhuma ferramenta. Depois é só abrir os galhos, distribuir os 54 enfeites e ligar as luzes.",
  },
  {
    q: "Os 54 enfeites estão realmente inclusos?",
    a: "Sim! O kit vem completo na caixa: bolas vermelhas e douradas, laços de veludo, flocos de neve, pinhas, caixinhas decorativas, estrela para o topo e a saia de árvore. Você não gasta mais nada com decoração.",
  },
  {
    q: "Qual é o prazo de entrega?",
    a: "Postamos em até 24 horas úteis e o prazo médio de entrega é de 5 a 10 dias úteis, dependendo da sua região. Você recebe o código de rastreio no WhatsApp assim que o pedido é enviado.",
  },
  {
    q: "Como eu pago?",
    a: "Só trabalhamos com Pix — e é de propósito, para conseguir deixar o preço nesse valor! É simples: clique em qualquer botão de compra e o QR Code do Pix já aparece na hora, na própria tela (com o aviso “Gerando seu pagamento…” enquanto preparamos tudo). Você escaneia no app do banco — ou toca em “Copiar código Pix” — e assim que o pagamento cair, a própria tela libera o formulário para você preencher nome e endereço de entrega. O frete combinamos com você pelo WhatsApp.",
  },
  {
    q: "E se eu não gostar do produto?",
    a: "Sem problema! Você tem 7 dias corridos após o recebimento para solicitar a devolução, conforme o Código de Defesa do Consumidor. Se não amar, devolvemos 100% do seu dinheiro.",
  },
];

/* ============================ COMPONENTES ============================ */

function MarqueeTopBar() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden bg-gradient-to-r from-rose-900 via-rose-600 to-rose-900 py-2">
      <div className="flex w-max animate-marquee items-center gap-10 px-4">
        {items.map((item, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-xs font-extrabold uppercase tracking-wider text-white sm:text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function UrgencyBar() {
  return (
    <div className="bg-[#2b0a16]/95 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-300 sm:text-sm">
          <Flame className="h-4 w-4 animate-blink" />
          Oferta termina em:
        </span>
        <Countdown compact />
      </div>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rose-200/20 bg-[#2b0a16]/95 backdrop-blur supports-[backdrop-filter]:bg-[#2b0a16]/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="#" className="flex items-center gap-2.5" aria-label="Club do Garimpo - início">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-md shadow-rose-950/50">
            <TreePine className="h-6 w-6 text-[#2b0a16]" />
          </span>
          <span className="leading-none">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Club do
            </span>
            <span className="block text-lg font-black uppercase tracking-wide text-white">
              Garimpo
            </span>
          </span>
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
          <a href="#beneficios" className="text-sm font-semibold text-rose-100/70 transition hover:text-amber-300">
            Benefícios
          </a>
          <a href="#kit" className="text-sm font-semibold text-rose-100/70 transition hover:text-amber-300">
            O que vem na caixa
          </a>
          <a href="#depoimentos" className="text-sm font-semibold text-rose-100/70 transition hover:text-amber-300">
            Depoimentos
          </a>
          <a href="#faq" className="text-sm font-semibold text-rose-100/70 transition hover:text-amber-300">
            Dúvidas
          </a>
        </nav>

        <a
          href="#oferta"
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-rose-950/50 transition hover:scale-105 sm:text-sm"
        >
          Aproveitar oferta
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

function PriceBlock({
  size = "lg",
  className,
}: {
  size?: "lg" | "xl";
  className?: string;
}) {
  const mainSize = size === "xl" ? "text-7xl sm:text-8xl" : "text-6xl sm:text-7xl";
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-semibold text-stone-400 line-through">
          de {SITE_CONFIG.oldPrice}
        </span>
        <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black uppercase text-white shadow-md shadow-rose-900/30">
          {SITE_CONFIG.discount}
        </span>
      </div>
      <div className="mt-1 flex items-end gap-1.5">
        <span className="pb-2 text-2xl font-bold text-rose-700 sm:text-3xl">R$</span>
        <span className={`price-shine leading-none ${mainSize} font-black`}>80</span>
        <span className="pb-2 text-3xl font-bold text-rose-700 sm:text-4xl">,00</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-stone-600 sm:text-base">
        {SITE_CONFIG.installments}
      </p>
    </div>
  );
}

function RatingRow({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 ${className ?? ""}`}
      aria-label="Avaliação 4.9 de 5 estrelas"
    >
      <div className="flex" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <span className="text-sm font-bold text-rose-950">4,9/5</span>
      <span className="text-sm text-stone-600">· mais de 2.300 clientes satisfeitos</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FBF7F2]">
      {/* brilhos decorativos de fundo */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-300/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl" aria-hidden="true" />
      <Sparkles className="pointer-events-none absolute left-[6%] top-24 hidden h-7 w-7 animate-twinkle text-amber-500 md:block" aria-hidden="true" />
      <Sparkles className="pointer-events-none absolute right-[10%] top-16 h-5 w-5 animate-twinkle text-rose-400 [animation-delay:0.7s]" aria-hidden="true" />
      <Sparkles className="pointer-events-none absolute bottom-24 left-[45%] hidden h-4 w-4 animate-twinkle text-rose-300 [animation-delay:1.4s] lg:block" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl gap-x-10 gap-y-6 px-4 pb-10 pt-6 sm:py-12 lg:min-h-[calc(100vh-9rem)] lg:grid-cols-2 lg:items-center lg:py-14">
        {/* 📸 FOTO REAL do produto — a primeira coisa que a pessoa vê */}
        <div className="order-1 mx-auto flex w-full max-w-md flex-col items-center justify-center lg:order-1 lg:max-w-[30rem]">
          <p className="mb-3 text-center font-script text-3xl leading-none text-rose-500 sm:text-4xl">
            Pequena na caixa, gigante no Natal 🎄
          </p>
          <div className="relative w-full">
            <div className="pointer-events-none absolute -inset-3 -rotate-2 rounded-[3rem] border-2 border-dashed border-rose-300/80" aria-hidden="true" />
            <div className="relative w-full overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl shadow-rose-900/25 ring-1 ring-rose-200">
              <Image
                src="/arvore-real.jpg"
                alt="Árvore de Natal de 2 metros decorada com estrela vermelha brilhante no topo, bolas vermelhas e prateadas e luzes acesas em uma sala aconchegante"
                width={941}
                height={1672}
                priority
                sizes="(max-width: 640px) 92vw, 480px"
                className="h-[470px] w-full object-cover object-top sm:h-[560px] lg:h-[min(580px,72vh)] lg:w-full"
              />

              {/* ✨ a mensagem — em cima da foto */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#380f1f]/95 via-[#380f1f]/60 to-transparent px-5 pb-5 pt-16 text-center sm:pb-6">
                <p className="font-script text-2xl leading-tight text-amber-300 drop-shadow-sm sm:text-3xl">
                  Isso é o que você recebe em casa 🎄
                </p>
                <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-rose-100 sm:text-xs">
                  Árvore de 2m · 54 enfeites inclusos · kit completo
                </p>
              </div>
            </div>

            <div className="animate-float absolute -left-3 top-8 rounded-2xl border border-rose-200 bg-white/95 px-4 py-3 shadow-xl shadow-rose-900/15 backdrop-blur sm:-left-6">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-rose-800">
                <Gift className="h-5 w-5 text-amber-600" /> 54 enfeites inclusos
              </p>
            </div>

            <div className="animate-float-slow absolute -right-3 top-1/2 rounded-2xl border border-rose-200 bg-white/95 px-4 py-3 shadow-xl shadow-rose-900/15 backdrop-blur sm:-right-6">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-rose-800">
                <Ruler className="h-5 w-5 text-amber-600" /> 2m de altura
              </p>
            </div>
          </div>
        </div>

        {/* textos — no celular, o botão vem LOGO ABAIXO da foto */}
        <div className="order-2 flex flex-col items-start gap-4 lg:order-2 lg:gap-5">
          <BuyButton className="animate-pulse-glow-rose order-1 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-rose-600 to-rose-800 px-8 py-4 text-center text-base font-black uppercase tracking-wide text-white shadow-xl shadow-rose-900/30 transition hover:scale-[1.02] hover:from-rose-500 hover:to-rose-700 sm:text-lg lg:order-6">
            <ShoppingBag className="h-6 w-6 shrink-0" />
            Comprar agora — R$ 80,00
          </BuyButton>

          <p className="order-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone-500 sm:text-sm lg:order-7">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-rose-600" /> Compra segura
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-rose-600" /> Envio rápido
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-rose-600" /> Garantia de 7 dias
            </span>
          </p>

          <span className="order-3 rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-rose-700 shadow-sm lg:order-1">
            ⭐ O mais vendido do Natal
          </span>

          <div className="order-4 lg:order-2">
            <h1 className="font-display text-4xl font-black leading-[1.08] text-[#3d0c1e] sm:text-5xl xl:text-6xl">
              Árvore de Natal{" "}
              <span className="italic text-rose-600">2 metros</span>{" "}
              com <span className="italic text-rose-600">54 enfeites</span> inclusos
            </h1>
          </div>

          <PriceBlock size="lg" className="order-5 lg:order-5" />

          <RatingRow className="order-6 lg:order-4" />

          <p className="order-7 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg lg:order-3">
            Visual premium, montagem fácil e o clima perfeito para a sua casa —
            sem gastar uma fortuna. Chegou a hora de deixar este Natal
            inesquecível para a família toda.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-rose-100 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-200">
              <item.icon className="h-5 w-5 text-rose-600" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-black uppercase text-rose-950">{item.title}</p>
              <p className="text-xs text-stone-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* 😍 Slogan fofinho com a figurinha — logo depois da foto real */
function SloganSticker() {
  return (
    <section
      aria-label="Slogan da loja"
      className="border-y border-rose-100 bg-gradient-to-r from-sky-50 via-rose-50 to-amber-50 py-8 sm:py-10"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 text-center sm:flex-row sm:gap-7 sm:text-left">
        <span className="flex h-24 w-24 shrink-0 rotate-3 items-center justify-center overflow-hidden rounded-[1.8rem] border-4 border-white bg-white p-1 shadow-xl shadow-rose-900/10 transition duration-300 hover:rotate-0 sm:h-28 sm:w-28">
          <Image
            src="/arvore-sticker.png"
            alt="Árvore de Natal de desenho com carinhas de emoji, luzinhas douradas e presentes"
            width={112}
            height={112}
            className="h-full w-full object-contain"
          />
        </span>
        <div>
          <p className="font-script text-3xl leading-tight text-rose-600 sm:text-4xl">
            Uma árvore que deixa todo mundo assim 😍
          </p>
          <p className="mt-1.5 text-sm font-bold text-stone-500 sm:text-base">
            Monta em minutinhos, acende as luzes e a casa inteira sorri junto ✨🎄
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================ PÁGINA ============================ */

/* 💰 Barra fixa de compra no celular — o botão fica SEMPRE visível,
   mesmo quando a pessoa rola a página. */
function StickyBuyBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-rose-200 bg-white/95 shadow-[0_-8px_24px_rgba(80,10,30,0.12)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="leading-tight">
          <p className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <span className="line-through">{SITE_CONFIG.oldPrice}</span>
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
              {SITE_CONFIG.discount}
            </span>
          </p>
          <p className="text-2xl font-black text-rose-700">{SITE_CONFIG.price}</p>
        </div>
        <BuyButton className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:from-rose-500 hover:to-rose-700">
          <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
          Comprar agora
        </BuyButton>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF7F2] pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <MarqueeTopBar />
      <UrgencyBar />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <SloganSticker />
        <TrustStrip />
        <Benefits />
        <KitSection />
        <Lifestyle />
        <Testimonials />
        <OfferSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
      <SupportButton />
      <StickyBuyBar />
      <AdminGate />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-center font-display text-3xl font-black leading-tight text-[#3d0c1e] sm:text-4xl">
        {children}
      </h2>
      <span className="mt-4 flex items-center gap-2.5" aria-hidden="true">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/90" />
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/90" />
      </span>
    </div>
  );
}

function Benefits() {
  return (
    <section id="beneficios" className="bg-[#FBF7F2] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle>
          Por que essa árvore{" "}
          <span className="italic text-rose-600">é imperdível?</span>
        </SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-stone-500">
          Tudo o que você precisa para o Natal perfeito, em um único kit — sem
          comprar nada separadamente.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <article
              key={b.title}
              className="group rounded-3xl border border-rose-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-200/70"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-md shadow-rose-900/25 transition group-hover:scale-110">
                <b.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-black text-rose-950">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{b.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function KitSection() {
  return (
    <section id="kit" className="bg-[#F9EEF1] py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl shadow-rose-900/20 ring-1 ring-rose-200">
            <Image
              src="/kit-enfeites.png"
              alt="Kit com 54 enfeites de Natal: bolas vermelhas e douradas, laços, flocos de neve, pinhas e estrela"
              width={1024}
              height={1024}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="absolute -top-4 right-4 rotate-6 rounded-full bg-rose-600 px-5 py-2 text-sm font-black uppercase text-white shadow-lg shadow-rose-900/40">
            54 peças!
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-black leading-tight text-[#3d0c1e] sm:text-4xl">
            O que vem <span className="italic text-rose-600">na caixa?</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-stone-600">
            Você recebe a árvore de 2 metros <strong className="text-rose-950">e o kit completo com 54
            enfeites</strong> no mesmo pacote. É só abrir, montar e decorar —
            tudo combinando no tema vermelho e dourado.
          </p>

          <ul className="mt-6 space-y-3">
            {KIT_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600/10 ring-1 ring-rose-400/60">
                  <Check className="h-4 w-4 text-rose-600" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-stone-700 sm:text-base">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border border-amber-300/80 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-800 sm:text-base">
              🎁 Valor total do kit separado: mais de R$ 150 — aqui está tudo incluso!
            </p>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-rose-200 bg-white p-4 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-md shadow-rose-900/25">
              <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
              <strong className="text-rose-700">Quer ainda mais charme?</strong> Adicione o{" "}
              <strong className="text-rose-700">Kit de Luzinhas por + R$ 20</strong> na hora da
              compra — as luzinhas vão na mesma caixa, junto com as bolinhas de enfeite.
            </p>
          </div>

          <a
            href="#oferta"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-800 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-rose-900/30 transition hover:scale-[1.03] hover:from-rose-500 hover:to-rose-700 sm:text-base"
          >
            Quero o kit completo
            <ChevronRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Lifestyle() {
  return (
    <section id="ambiente" className="bg-[#FBF7F2] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle>
          O Natal que <span className="italic text-rose-600">sua casa merece</span>
        </SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-stone-500">
          Imagine chegar em casa, acender as luzes da árvore e ver o rosto da
          família inteira se iluminar junto. É esse momento que a gente quer
          entregar para você — com qualidade de loja e preço de garimpo.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-5">
          <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl shadow-rose-900/20 ring-1 ring-rose-200 lg:col-span-3">
            <Image
              src="/ambiente-natal.png"
              alt="Sala de estar aconchegante com árvore de Natal acesa ao lado do sofá"
              width={1344}
              height={768}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl shadow-rose-900/20 ring-1 ring-rose-200 lg:col-span-2">
            <Image
              src="/arvore-detalhe.png"
              alt="Detalhe dos galhos da árvore com bolas vermelhas e douradas e luzes acesas"
              width={1344}
              height={768}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
          {[
            { emoji: "🏡", text: "Casa com clima de Natal em minutos" },
            { emoji: "👨‍👩‍👧‍👦", text: "Momentos que viram memória" },
            { emoji: "📸", text: "Fotos dignas de revista" },
          ].map((i) => (
            <p
              key={i.text}
              className="rounded-3xl border border-rose-100 bg-white px-4 py-5 text-sm font-bold text-stone-600 shadow-sm"
            >
              <span className="mb-1 block text-2xl" aria-hidden="true">{i.emoji}</span>
              {i.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="depoimentos" className="relative overflow-hidden bg-[#380f1f] py-14 sm:py-20">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-rose-500/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center">
          <h2 className="text-center font-display text-3xl font-black leading-tight text-white sm:text-4xl">
            Quem comprou, <span className="italic text-rose-300">amou</span>
          </h2>
          <span className="mt-4 flex items-center gap-2.5" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300/80" />
            <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300/80" />
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-rose-100/60">
          Milhares de famílias já garantiram a sua árvore pelo Club do Garimpo.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-3xl border border-rose-200/15 bg-[#471527] p-6 shadow-xl shadow-rose-950/40"
            >
              <div className="flex gap-0.5" aria-label="Avaliação: 5 de 5 estrelas">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-300 text-amber-300" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-rose-100/85">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-rose-200/15 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-sm font-black text-white">
                  {t.name.charAt(0)}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-black text-white">{t.name}</span>
                  <span className="flex items-center gap-1 text-xs text-rose-100/60">
                    <Heart className="h-3 w-3 fill-rose-400 text-rose-400" aria-hidden="true" />
                    Compra verificada · {t.city}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferSection() {
  const soldPct = Math.round(
    ((SITE_CONFIG.stockTotal - SITE_CONFIG.stockRemaining) / SITE_CONFIG.stockTotal) * 100
  );
  return (
    <section id="oferta" className="bg-[#FBF7F2] py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-[2.2rem] bg-gradient-to-br from-amber-200 via-rose-300 to-amber-200 p-1.5 shadow-2xl shadow-rose-900/25">
          <div className="rounded-[2rem] bg-[#FBF7F2] p-6 sm:p-10">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-900/40">
                <Flame className="h-4 w-4 animate-blink" aria-hidden="true" />
                Oferta relâmpago — só hoje
              </span>

              <h2 className="mt-4 font-display text-3xl font-black uppercase leading-tight text-[#3d0c1e] sm:text-4xl">
                Árvore 2m + kit completo
                <span className="block normal-case italic text-rose-600">por R$ 80,00</span>
              </h2>

              <div className="mt-5 flex justify-center">
                <Countdown />
              </div>

              <div className="mx-auto mt-6 max-w-sm">
                <PriceBlock size="xl" />
              </div>

              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-stone-500">
                  <span>🔥 81% do estoque vendido</span>
                  <span className="text-rose-600">
                    Restam {SITE_CONFIG.stockRemaining} de {SITE_CONFIG.stockTotal}
                  </span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-rose-100"
                  role="progressbar"
                  aria-valuenow={soldPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Porcentagem do estoque vendido"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400"
                    style={{ width: `${soldPct}%` }}
                  />
                </div>
              </div>

              <BuyButton className="animate-pulse-glow-rose mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-5 text-lg font-black uppercase tracking-wide text-white shadow-xl shadow-rose-900/30 transition hover:scale-[1.02] hover:from-rose-500 hover:to-rose-700 sm:text-xl">
                <ShoppingBag className="h-7 w-7 shrink-0" />
                Comprar agora — R$ 80,00
              </BuyButton>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <span className="flex items-center gap-2 rounded-full border-2 border-rose-300 bg-rose-100 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-rose-700 sm:text-base">
                  <QrCode className="h-5 w-5" aria-hidden="true" /> QR Code Pix na hora, sem sair do site
                </span>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500 sm:text-sm">
                <ShieldCheck className="h-4 w-4 text-rose-600" aria-hidden="true" />
                Garantia de 7 dias: se não amar, devolvemos 100% do seu dinheiro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="bg-[#F9EEF1] py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle>
          Dúvidas <span className="italic text-rose-600">frequentes</span>
        </SectionTitle>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-rose-100 bg-white px-5 last:border-b"
            >
              <AccordionTrigger className="text-left text-sm font-black uppercase text-rose-950 hover:text-rose-600 hover:no-underline sm:text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-stone-600 sm:text-base">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-8 text-center text-sm text-stone-500">
          Ainda tem dúvida?{" "}
          <a
            href={whatsappOrderUrl("Olá! Tenho uma dúvida sobre a Árvore de Natal 2m com 54 enfeites 😊")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-rose-600 underline underline-offset-4 transition hover:text-rose-700"
          >
            Fale com a gente no WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#2b0a16] via-[#521228] to-[#2b0a16] py-16 sm:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-rose-500/20 blur-3xl" aria-hidden="true" />
      <Sparkles className="pointer-events-none absolute left-[12%] top-16 hidden h-6 w-6 animate-twinkle text-amber-300 md:block" aria-hidden="true" />
      <Sparkles className="pointer-events-none absolute bottom-20 right-[14%] hidden h-5 w-5 animate-twinkle text-rose-300 [animation-delay:0.9s] md:block" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <p className="font-script text-3xl leading-none text-rose-300 sm:text-4xl" aria-hidden="true">
          Última chamada
        </p>
        <h2 className="mt-2 font-display text-4xl font-black uppercase leading-tight text-white sm:text-5xl">
          Não deixe o Natal{" "}
          <span className="normal-case italic text-rose-300">para depois</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-rose-100/70 sm:text-lg">
          O estoque é limitado e o preço de R$ 80,00 é só por hoje. Garanta a
          sua árvore com o kit completo agora — e deixe a casa pronta para a
          noite mais mágica do ano.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <BuyButton className="animate-pulse-glow-rose flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-8 py-4 text-base font-black uppercase tracking-wide text-[#3d0c1e] shadow-xl shadow-rose-950/50 transition hover:scale-[1.03] hover:from-amber-200 hover:to-amber-400 sm:w-auto sm:text-lg">
            <ShoppingBag className="h-6 w-6 shrink-0" />
            Comprar minha árvore agora
          </BuyButton>
          <a
            href={SITE_CONFIG.whatsappGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-rose-300/40 bg-white/5 px-8 py-4 text-base font-black uppercase tracking-wide text-rose-100 transition hover:scale-[1.03] hover:bg-white/10 sm:w-auto sm:text-lg"
          >
            <Gift className="h-5 w-5 shrink-0" aria-hidden="true" />
            Entrar no grupo VIP grátis
          </a>
        </div>

        <p className="mt-6 text-xs font-semibold text-rose-100/50">
          Envio rápido · Compra segura · Garantia de 7 dias
        </p>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rose-200/10 bg-[#20060f]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500">
                <TreePine className="h-5 w-5 text-[#2b0a16]" aria-hidden="true" />
              </span>
              <span className="leading-none">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  Club do
                </span>
                <span className="block text-base font-black uppercase text-white">Garimpo</span>
              </span>
            </p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-rose-100/50">
              Produtos selecionados com preço de garimpo e entrega rápida para
              todo o Brasil. Natal dos sonhos, sem assustar no bolso.
            </p>
          </div>

          <nav aria-label="Links do rodapé">
            <p className="text-sm font-black uppercase text-amber-300">Atalhos</p>
            <ul className="mt-3 space-y-2 text-sm text-rose-100/60">
              <li><a href="#beneficios" className="transition hover:text-amber-300">Benefícios</a></li>
              <li><a href="#kit" className="transition hover:text-amber-300">O que vem na caixa</a></li>
              <li><a href="#depoimentos" className="transition hover:text-amber-300">Depoimentos</a></li>
              <li><a href="#faq" className="transition hover:text-amber-300">Dúvidas frequentes</a></li>
              <li><a href="#oferta" className="transition hover:text-amber-300">Oferta de hoje</a></li>
            </ul>
          </nav>

          <div>
            <p className="text-sm font-black uppercase text-amber-300">Garantias</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-rose-100/50">
              <li>✓ Postagem em até 24h úteis com rastreio</li>
              <li>✓ 7 dias para devolução (CDC art. 49)</li>
              <li>✓ Pagamento processado em ambiente seguro</li>
              <li>✓ Atendimento humano pelo WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-rose-200/10 pt-6 text-center">
          <p className="text-xs text-rose-100/40">
            © 2026 Club do Garimpo · CNPJ 00.000.000/0001-00 · Todos os direitos reservados
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-[11px] leading-relaxed text-rose-100/30">
            Este site não é afiliado ao WhatsApp Inc. ou à Meta Platforms Inc.
            Imagens meramente ilustrativas. Oferta válida enquanto durarem os
            estoques.
          </p>
        </div>
      </div>
    </footer>
  );
}
