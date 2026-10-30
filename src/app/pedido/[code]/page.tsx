import type { Metadata } from "next";
import TrackingView from "@/components/site/tracking-view";

export const metadata: Metadata = {
  title: "Acompanhar pedido — Club do Garimpo",
  description:
    "Veja em tempo real o status da sua Árvore de Natal: pagamento confirmado, a caminho e entregue.",
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <TrackingView code={code.toUpperCase()} />;
}
