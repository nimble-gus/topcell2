"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // No usar basePath, el endpoint único detectará que es admin por la cookie
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

