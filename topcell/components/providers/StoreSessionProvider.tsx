"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function StoreSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // No usar basePath, el endpoint único detectará que es store por la cookie
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

