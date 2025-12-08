import { NextRequest, NextResponse } from "next/server";

/**
 * API Route para manejar el callback POST de Cardinal Commerce
 * Cardinal Commerce puede intentar hacer un POST directo a este endpoint
 * desde el iframe después de completar el Step-Up (Paso 4)
 */
export async function POST(request: NextRequest) {
  try {
    // Cardinal Commerce puede enviar datos en el body
    const body = await request.text();
    console.log("=== Callback POST recibido de Cardinal Commerce ===");
    console.log("Body:", body);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    // Este endpoint solo recibe el POST, pero el flujo real
    // se maneja a través de window.postMessage en el frontend
    // Retornamos un 200 OK para que Cardinal Commerce no reintente
    return NextResponse.json(
      { 
        success: true,
        message: "Callback recibido. El flujo continúa a través de window.postMessage."
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en callback POST:", error);
    return NextResponse.json(
      { error: "Error al procesar callback" },
      { status: 500 }
    );
  }
}

/**
 * También permitir GET por si Cardinal Commerce intenta redirigir
 */
export async function GET(request: NextRequest) {
  // Si viene con query params, redirigir a la página de callback
  const searchParams = request.nextUrl.searchParams;
  const ordenId = searchParams.get("ordenId");
  const referenceId = searchParams.get("referenceId");
  const systemsTraceNo = searchParams.get("systemsTraceNo");
  const paso = searchParams.get("paso");

  if (ordenId && referenceId) {
    // Redirigir a la página de callback con los parámetros
    const callbackUrl = new URL("/pago/3dsecure/callback", request.url);
    callbackUrl.searchParams.set("ordenId", ordenId);
    callbackUrl.searchParams.set("referenceId", referenceId);
    if (systemsTraceNo) callbackUrl.searchParams.set("systemsTraceNo", systemsTraceNo);
    if (paso) callbackUrl.searchParams.set("paso", paso);
    
    return NextResponse.redirect(callbackUrl);
  }

  return NextResponse.json(
    { error: "Faltan parámetros requeridos" },
    { status: 400 }
  );
}

