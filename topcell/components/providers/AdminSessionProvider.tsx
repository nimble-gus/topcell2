"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // No usar basePath, el endpoint único detectará que es admin por la cookie
  // Agregar refetchInterval para mantener la sesión actualizada
  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // Refrescar cada 5 minutos
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

