import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description: "Regístrate en TopCell para ver tus órdenes, gestionar tu perfil y disfrutar de una experiencia de compra personalizada.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

