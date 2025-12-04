import { NextRequest } from "next/server";
import { adminHandlers } from "@/lib/auth-admin";
import { storeHandlers } from "@/lib/auth-store";

// Determinar qué handler usar basándose en las cookies, headers o referer
function getHandler(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Verificar header personalizado del middleware o del cliente
  const authContext = request.headers.get("x-auth-context");
  if (authContext === "admin") {
    return adminHandlers;
  }
  
  // CRÍTICO: Si la ruta contiene "admin-credentials" en el pathname, es un signIn de admin
  if (pathname.includes("admin-credentials")) {
    return adminHandlers;
  }
  
  // CRÍTICO: Si la ruta contiene "store-credentials" en el pathname, es un signIn de store
  if (pathname.includes("store-credentials")) {
    return storeHandlers;
  }
  
  // Verificar el referer para determinar el contexto
  // El referer contiene la URL completa de la página que hizo la request
  const referer = request.headers.get("referer");
  let isAdminReferer = false;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      isAdminReferer = refererUrl.pathname.startsWith("/admin");
    } catch {
      // Si no se puede parsear el referer, verificar si contiene "/admin"
      isAdminReferer = referer.includes("/admin/login") || referer.includes("/admin/");
    }
  }
  
  // Verificar el origin también
  const origin = request.headers.get("origin");
  let isAdminOrigin = false;
  if (origin) {
    try {
      const originUrl = new URL(origin);
      isAdminOrigin = originUrl.pathname.startsWith("/admin");
    } catch {
      isAdminOrigin = origin.includes("/admin");
    }
  }
  
  // Nombres de cookies
  const adminCookieName = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.admin.session-token"
    : "next-auth.admin.session-token";
  const storeCookieName = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.store.session-token"
    : "next-auth.store.session-token";
  
  const hasAdminCookie = request.cookies.has(adminCookieName);
  const hasStoreCookie = request.cookies.has(storeCookieName);
  
  // REGLA CRÍTICA DE SEGURIDAD:
  // Si el referer/origin indica contexto de admin, usar admin handler
  // Si NO hay referer/origin de admin, SIEMPRE usar store handler (incluso si hay cookie de admin)
  // Esto previene que admins vean su sesión en la tienda
  
  if (isAdminReferer || isAdminOrigin) {
    // Estamos en contexto de admin, usar admin handler
    return adminHandlers;
  }
  
  // NO estamos en contexto de admin, SIEMPRE usar store handler
  // Esto asegura que la tienda NUNCA vea sesiones de admin
  // Incluso si hay una cookie de admin, la ignoramos si no estamos en /admin
  return storeHandlers;
}

export async function GET(request: NextRequest) {
  const handler = getHandler(request);
  return handler.GET(request as any);
}

export async function POST(request: NextRequest) {
  const handler = getHandler(request);
  return handler.POST(request as any);
}

