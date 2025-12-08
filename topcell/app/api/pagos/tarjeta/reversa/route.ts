import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildReversaPayload,
  callNeoPayAPI,
} from "@/lib/neopay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ordenId } = body;

    // Validar datos requeridos
    if (!ordenId) {
      return NextResponse.json(
        { error: "Falta el ID de la orden" },
        { status: 400 }
      );
    }

    // Verificar que la orden existe
    const orden = await prisma.orden.findUnique({
      where: { id: parseInt(ordenId) },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    if (orden.metodoPago !== "TARJETA") {
      return NextResponse.json(
        { error: "Esta orden no está configurada para pago con tarjeta" },
        { status: 400 }
      );
    }

    if (!orden.systemsTraceNoOriginal) {
      return NextResponse.json(
        { error: "No se encontró el SystemsTraceNo original de la transacción" },
        { status: 400 }
      );
    }

    // Construir payload de reversa
    const reversaData = {
      systemsTraceNoOriginal: orden.systemsTraceNoOriginal,
      montoOriginal: Number(orden.total),
      retrievalRefNo: orden.retrievalRefNo || undefined,
    };

    const payload = buildReversaPayload(reversaData);

    // Log del payload de reversa
    console.log("=== Enviando Reversa a NeoPay ===");
    console.log("Orden ID:", orden.id);
    console.log("SystemsTraceNo Original:", orden.systemsTraceNoOriginal);
    console.log("Monto:", orden.total);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Llamar a NeoPay
    const neopayResponse = await callNeoPayAPI(payload, request.headers);

    // Log de la respuesta
    console.log("=== Respuesta de Reversa de NeoPay ===");
    console.log("ResponseCode:", neopayResponse.ResponseCode);
    console.log("ResponseMessage:", neopayResponse.ResponseMessage);
    console.log("Respuesta completa:", JSON.stringify(neopayResponse, null, 2));

    // Verificar si fue aprobada (ResponseCode "00" o "10" = aprobada)
    const aprobada = neopayResponse.ResponseCode === "00" || neopayResponse.ResponseCode === "10";

    // Actualizar orden con la respuesta de la reversa
    await prisma.orden.update({
      where: { id: orden.id },
      data: {
        respuestaPago: JSON.stringify(neopayResponse),
        estadoPago: aprobada ? "REVERSADO" : "ERROR_REVERSA",
        codigoRespuesta: neopayResponse.ResponseCode || "ERROR",
        mensajeRespuesta: neopayResponse.ResponseMessage || neopayResponse.PrivateUse63?.AlternateHostResponse22 || "Error al reversar",
        // Guardar datos de la reversa para voucher
        retrievalRefNo: neopayResponse.RetrievalRefNo || orden.retrievalRefNo,
        authIdResponse: neopayResponse.AuthIdResponse || orden.authIdResponse,
      },
    });

    if (aprobada) {
      return NextResponse.json({
        success: true,
        aprobado: true,
        ordenId: orden.id,
        mensaje: "Reversa procesada exitosamente",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          aprobado: false,
          error: neopayResponse.ResponseMessage || neopayResponse.PrivateUse63?.AlternateHostResponse22 || "Error al reversar la transacción",
          codigoRespuesta: neopayResponse.ResponseCode,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error al reversar pago con tarjeta:", error);
    
    // Si es timeout, intentar ejecutar reversa automática
    if (error.isTimeout) {
      return NextResponse.json(
        {
          error: "Timeout al intentar reversar. La reversa automática debería ejecutarse automáticamente.",
          isTimeout: true,
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      {
        error: error.message || "Error al procesar la reversa",
      },
      { status: 500 }
    );
  }
}

