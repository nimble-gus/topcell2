import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Agregar header para identificar contexto de admin en requests a /api/auth
  // cuando vienen de rutas de admin
  if (pathname.startsWith("/api/auth")) {
    const referer = request.headers.get("referer");
    const origin = request.headers.get("origin");
    
    // Verificar referer y origin para contexto de admin
    const isAdminReferer = referer && (referer.includes("/admin") || referer.includes("/admin/"));
    const isAdminOrigin = origin && (origin.includes("/admin") || origin.includes("/admin/"));
    
    if (isAdminReferer || isAdminOrigin) {
      const response = NextResponse.next();
      response.headers.set("x-auth-context", "admin");
      return response;
    }
    
    // Si hay cookie de admin, también marcar como admin
    // Verificar tanto la versión de producción como desarrollo
    const adminCookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.admin.session-token"
      : "next-auth.admin.session-token";
    const storeCookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.store.session-token"
      : "next-auth.store.session-token";
    
    // Solo marcar como admin si hay cookie de admin Y NO hay cookie de store
    // O si estamos en una ruta que claramente es de admin
    if (request.cookies.has(adminCookieName) && !request.cookies.has(storeCookieName)) {
      const response = NextResponse.next();
      response.headers.set("x-auth-context", "admin");
      return response;
    }
    
    // Por defecto, no agregar header (será detectado como store)
    return NextResponse.next();
  }

  // IMPORTANTE: Excluir /admin/login del middleware
  // Si es la ruta de login, NO aplicar el middleware (retornar inmediatamente)
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Proteger todas las demás rutas /admin/*
  if (pathname.startsWith("/admin")) {
    // Verificar token JWT del admin
    // Leer la cookie específica de admin (tanto producción como desarrollo)
    const adminCookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.admin.session-token"
      : "next-auth.admin.session-token";
    const adminCookie = request.cookies.get(adminCookieName)?.value;
    
    if (!adminCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar el token JWT
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: adminCookieName,
      });
      
      // Si no hay token válido, redirigir al login
      if (!token || token.type !== "admin") {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Si hay token válido de admin, permitir acceso
      return NextResponse.next();
    } catch (error) {
      // Si hay error al verificar el token, redirigir al login
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Incluir rutas de admin y rutas de auth
    "/admin/:path*",
    "/api/auth/:path*",
  ],
};

