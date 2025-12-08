"use client";

import { useSession as useNextAuthSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

// Hook personalizado para autenticación de usuarios de la tienda
export function useStoreSession() {
  const { data: session, status } = useNextAuthSession();
  
  // Verificar que la sesión es de tipo user (no admin)
  const storeSession = session?.user && (session.user as any).type === "user" ? session : null;
  
  return {
    data: storeSession,
    status: storeSession ? status : "unauthenticated",
  };
}

export async function storeSignIn(credentials: { email: string; password: string }) {
  return await nextAuthSignIn("store-credentials", {
    ...credentials,
    redirect: false,
    callbackUrl: "/",
  });
}

export async function storeSignOut() {
  return await nextAuthSignOut({ callbackUrl: "/" });
}

