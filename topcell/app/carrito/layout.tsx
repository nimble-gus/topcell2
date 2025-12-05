import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrito de Compras",
  description: "Revisa los productos en tu carrito. Modifica cantidades o elimina items antes de proceder al checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CarritoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

