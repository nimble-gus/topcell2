"use client";

// Este provider es para usuarios de la tienda (no admin)
import StoreSessionProvider from "./StoreSessionProvider";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreSessionProvider>{children}</StoreSessionProvider>;
}

