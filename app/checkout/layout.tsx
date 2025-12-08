import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - Finalizar Compra",
  description: "Completa tu compra de forma segura. Envío a domicilio o recogida en bodega. Pago contra entrega o transferencia bancaria.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

