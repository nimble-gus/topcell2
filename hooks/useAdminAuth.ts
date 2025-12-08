"use client";

import { useSession as useNextAuthSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

// Hook personalizado para autenticación de admin
export function useAdminSession() {
  // Usar fetch directo a la ruta de admin
  const { data: session, status } = useNextAuthSession();
  
  // Verificar que la sesión es de tipo admin
  const adminSession = session?.user && (session.user as any).type === "admin" ? session : null;
  
  return {
    data: adminSession,
    status: adminSession ? status : "unauthenticated",
  };
}

export async function adminSignIn(credentials: { email: string; password: string }) {
  return await nextAuthSignIn("admin-credentials", {
    ...credentials,
    redirect: false,
    callbackUrl: "/admin",
  });
}

export async function adminSignOut() {
  return await nextAuthSignOut({ callbackUrl: "/admin/login" });
}

