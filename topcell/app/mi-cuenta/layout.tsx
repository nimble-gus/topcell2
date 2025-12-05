import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Cuenta",
  description: "Gestiona tu perfil y revisa el estado de tus pedidos. Actualiza tu información de contacto y dirección.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

