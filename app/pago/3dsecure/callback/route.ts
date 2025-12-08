import { NextRequest, NextResponse } from "next/server";

/**
 * API Route para manejar el callback POST de Cardinal Commerce
 * Cardinal Commerce intenta hacer un POST directo a esta URL desde el iframe
 * después de completar el Step-Up (Paso 4)
 * 
 * Esta ruta maneja POSTs desde Cardinal Commerce sin que Next.js los trate como Server Actions
 * 
 * IMPORTANTE: El page.tsx fue movido a /pago/3dsecure/callback-page para evitar conflictos
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Cardinal Commerce puede enviar datos en el body (form data o JSON)
    let body: string = "";
    try {
      body = await request.text();
    } catch (e) {
      // Si no hay body, está bien
      console.log("No body en POST de Cardinal Commerce");
    }
    
    console.log("=== ✅ Callback POST recibido de Cardinal Commerce ===");
    console.log("Body:", body || "(vacío)");
    console.log("Content-Type:", request.headers.get("content-type"));
    console.log("Origin:", request.headers.get("origin"));
    console.log("Referer:", request.headers.get("referer"));
    console.log("User-Agent:", request.headers.get("user-agent"));

    // Este endpoint solo recibe el POST, pero el flujo real
    // se maneja a través de window.postMessage en el frontend
    // Retornamos un 200 OK con HTML simple para que Cardinal Commerce no reintente
    // Cardinal Commerce puede esperar una respuesta HTML o JSON
    return new NextResponse(
      '<html><body><script>window.parent.postMessage({MessageType:"profile.completed",Status:true},"*");</script></body></html>',
      { 
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      }
    );
  } catch (error: any) {
    console.error("❌ Error en callback POST:", error);
    return new NextResponse(
      '<html><body>Error</body></html>',
      { 
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      }
    );
  }
}

/**
 * Manejar GET - redirigir al callback-page para que el flujo normal continúe
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ordenId = searchParams.get("ordenId");
  const referenceId = searchParams.get("referenceId");
  const systemsTraceNo = searchParams.get("systemsTraceNo");
  const paso = searchParams.get("paso");
  
  // Redirigir al callback-page que tiene el page.tsx
  const callbackPageUrl = new URL("/pago/3dsecure/callback-page", request.url);
  if (ordenId) callbackPageUrl.searchParams.set("ordenId", ordenId);
  if (referenceId) callbackPageUrl.searchParams.set("referenceId", referenceId);
  if (systemsTraceNo) callbackPageUrl.searchParams.set("systemsTraceNo", systemsTraceNo);
  if (paso) callbackPageUrl.searchParams.set("paso", paso);
  
  return NextResponse.redirect(callbackPageUrl);
}

/**
 * Manejar OPTIONS para CORS (preflight)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

