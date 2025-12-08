import { NextRequest } from "next/server";
import { adminHandlers } from "@/lib/auth-admin";
import { storeHandlers } from "@/lib/auth-store";

// Determinar qué handler usar basándose en las cookies, headers o referer
function getHandler(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Prioridad 1: Header personalizado del middleware
  const authContext = request.headers.get("x-auth-context");
  if (authContext === "admin") {
    return adminHandlers;
  }
  
  // Prioridad 2: Pathname contiene identificadores de provider
  if (pathname.includes("admin-credentials")) {
    return adminHandlers;
  }
  
  if (pathname.includes("store-credentials")) {
    return storeHandlers;
  }
  
  // Prioridad 3: Verificar el referer para determinar el contexto
  const referer = request.headers.get("referer");
  let isAdminReferer = false;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      isAdminReferer = refererUrl.pathname.startsWith("/admin");
    } catch {
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
  
  // Prioridad 4: Si hay referer/origin de admin, usar admin handler
  if (isAdminReferer || isAdminOrigin) {
    return adminHandlers;
  }
  
  // Prioridad 5: Verificar cookies para determinar el contexto
  // Si hay cookie de admin pero NO cookie de store, usar admin handler
  if (hasAdminCookie && !hasStoreCookie) {
    // Pero solo si el referer indica que estamos en contexto de admin
    // Si no hay referer o el referer no es de admin, usar store handler por seguridad
    if (isAdminReferer || isAdminOrigin) {
      return adminHandlers;
    }
    // Si hay cookie de admin pero no estamos en contexto de admin, usar store handler
    // Esto previene que admins vean su sesión en la tienda
    return storeHandlers;
  }
  
  // Prioridad 6: Si hay cookie de store pero NO cookie de admin, usar store handler
  if (hasStoreCookie && !hasAdminCookie) {
    return storeHandlers;
  }
  
  // Prioridad 7: Si ambas cookies están presentes, usar el contexto del referer
  if (hasAdminCookie && hasStoreCookie) {
    if (isAdminReferer || isAdminOrigin) {
      return adminHandlers;
    }
    return storeHandlers;
  }
  
  // Prioridad 8: Por defecto, si no hay contexto claro, usar store handler para la tienda pública
  // Esto es seguro porque la tienda pública nunca debería ver sesiones de admin
  return storeHandlers;
}

export async function GET(request: NextRequest) {
  try {
    const handler = getHandler(request);
    const response = await handler.GET(request as any);
    // Asegurar que la respuesta tenga headers correctos
    if (response instanceof Response) {
      return response;
    }
    return response;
  } catch (error: any) {
    console.error("Error in GET /api/auth/[...nextauth]:", error);
    return Response.json(
      { error: "Error de autenticación", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const handler = getHandler(request);
    const response = await handler.POST(request as any);
    // Asegurar que la respuesta tenga headers correctos
    if (response instanceof Response) {
      return response;
    }
    return response;
  } catch (error: any) {
    console.error("Error in POST /api/auth/[...nextauth]:", error);
    return Response.json(
      { error: "Error de autenticación", message: error.message },
      { status: 500 }
    );
  }
}

