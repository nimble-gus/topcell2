import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildPaso5Payload,
  callNeoPayAPI,
  ejecutarReversaAutomatica,
  getResponseCodeMessage,
  isTimeoutResponseCode,
  isApprovedResponseCode,
  isPartialAuthorizationCode,
} from "@/lib/neopay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ordenId, referenceId, systemsTraceNo } = body;

    // Validar datos requeridos
    if (!ordenId || !referenceId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (ordenId, referenceId)" },
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

    // Usar el systemsTraceNo proporcionado o el original de la orden
    const traceNo = systemsTraceNo || orden.systemsTraceNoOriginal || "";

    // ✅ Obtener valores del Paso 1 y Paso 3 desde respuestaPago
    let paso1Data: any = null;
    let paso3Data: any = null;
    try {
      if (orden.respuestaPago) {
        const respuestaPago = JSON.parse(orden.respuestaPago);
        paso1Data = respuestaPago.paso1Data;
        paso3Data = respuestaPago.paso3Data; // Datos guardados en Paso 3 cuando se detectó Step: "4"
        
        if (!paso1Data) {
          console.warn("⚠️ paso1Data no está presente, intentando construir desde respuestaPago...");
          if (respuestaPago.SystemsTraceNo) {
            paso1Data = {
              messageTypeId: "0200",
              processingCode: respuestaPago.ProcessingCode || "000000",
              systemsTraceNo: respuestaPago.SystemsTraceNo,
              posEntryMode: respuestaPago.PosEntryMode || "012",
              nii: respuestaPago.Nii || "003",
              posConditionCode: respuestaPago.PosConditionCode || "00",
              orderInformation: respuestaPago.OrderInformation || "",
              additionalData: respuestaPago.AdditionalData || "",
            };
          }
        }
        
        // Si tenemos paso3Data, usarlo (tiene los valores correctos del Paso 3)
        if (paso3Data) {
          console.log("✅ Usando datos del Paso 3 para construir Paso 5");
          console.log("DirectoryServerTransactionId:", paso3Data.directoryServerTransactionId);
        }
      }
    } catch (error) {
      console.error("❌ Error al obtener los valores del Paso 1/3:", error);
    }

    // Construir payload para Paso 5 usando valores del Paso 3 (si están disponibles) o Paso 1
    const dataParaPaso5 = paso3Data || paso1Data;
    const payload = buildPaso5Payload({
      systemsTraceNo: traceNo,
      referenceId: referenceId,
      directoryServerTransactionId: paso3Data?.directoryServerTransactionId,
      messageTypeId: dataParaPaso5?.messageTypeId,
      processingCode: dataParaPaso5?.processingCode,
      posEntryMode: dataParaPaso5?.posEntryMode,
      nii: dataParaPaso5?.nii,
      posConditionCode: dataParaPaso5?.posConditionCode,
      orderInformation: dataParaPaso5?.orderInformation,
      additionalData: dataParaPaso5?.additionalData,
    });

    console.log("=== Payload Paso 5 ===");
    console.log("SystemsTraceNo:", payload.SystemsTraceNo);
    console.log("ReferenceId:", payload.PayerAuthentication?.ReferenceId);
    console.log("Step:", payload.PayerAuthentication?.Step);
    console.log("DirectoryServerTransactionId:", payload.PayerAuthentication?.DirectoryServerTransactionId);

    // Llamar a NeoPay con manejo de timeout (90 segundos para Paso 5 también)
    let neopayResponse: any;
    let reversaEjecutada = false;
    
    try {
      neopayResponse = await callNeoPayAPI(payload, request.headers, 90000); // 90 segundos
    } catch (error: any) {
      // Si hay timeout, ejecutar reversa automática
      if (error.isTimeout) {
        console.error("=== Timeout detectado en Paso 5, ejecutando reversa automática ===");
        
        const systemsTraceNoOriginal = orden.systemsTraceNoOriginal || traceNo;
        
        try {
          const reversaData = {
            systemsTraceNoOriginal: systemsTraceNoOriginal,
            montoOriginal: Number(orden.total),
            retrievalRefNo: orden.retrievalRefNo || undefined,
          };
          
          await ejecutarReversaAutomatica(reversaData, request.headers);
          reversaEjecutada = true;
          
          await prisma.orden.update({
            where: { id: orden.id },
            data: {
              estadoPago: "REVERSADO",
              codigoRespuesta: "TIMEOUT",
              mensajeRespuesta: "Transacción excedió el tiempo límite en Paso 5. Reversa automática ejecutada.",
            },
          });
          
          return NextResponse.json(
            {
              success: false,
              error: "La transacción excedió el tiempo límite. Se ejecutó una reversa automática.",
              reversaEjecutada: true,
            },
            { status: 408 }
          );
        } catch (reversaError: any) {
          console.error("=== Error al ejecutar reversa automática ===");
          console.error("Error:", reversaError);
          
          await prisma.orden.update({
            where: { id: orden.id },
            data: {
              estadoPago: "ERROR_TIMEOUT",
              codigoRespuesta: "TIMEOUT",
              mensajeRespuesta: `Timeout en Paso 5. Error al ejecutar reversa: ${reversaError.message}`,
            },
          });
          
          return NextResponse.json(
            {
              success: false,
              error: "La transacción excedió el tiempo límite y no se pudo ejecutar la reversa automática.",
              reversaEjecutada: false,
              errorReversa: reversaError.message,
            },
            { status: 500 }
          );
        }
      }
      
      throw error;
    }

    console.log("=== Respuesta de NeoPay (Paso 5) ===");
    console.log("ResponseCode:", neopayResponse.ResponseCode);
    console.log("ResponseMessage:", neopayResponse.ResponseMessage);
    console.log("TypeOperation:", neopayResponse.TypeOperation);
    console.log("Step:", neopayResponse.PayerAuthentication?.Step);

    const responseCode = neopayResponse.ResponseCode?.toString();
    const typeOperation = neopayResponse.TypeOperation?.toString();

    // ✅ Detectar códigos de timeout (68, 91, 98) y ejecutar reversa automática
    if (responseCode && isTimeoutResponseCode(responseCode)) {
      console.error("=== Código de timeout detectado en Paso 5, ejecutando reversa automática ===");
      
      const systemsTraceNoOriginal = orden.systemsTraceNoOriginal || traceNo;
      
      try {
        const reversaData = {
          systemsTraceNoOriginal: systemsTraceNoOriginal,
          montoOriginal: Number(orden.total),
          retrievalRefNo: orden.retrievalRefNo || undefined,
        };
        
        await ejecutarReversaAutomatica(reversaData, request.headers);
        
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "REVERSADO",
            codigoRespuesta: responseCode,
            mensajeRespuesta: `Timeout detectado en Paso 5 (${getResponseCodeMessage(responseCode)}). Reversa automática ejecutada.`,
          },
        });
        
        return NextResponse.json(
          {
            success: false,
            error: `Timeout detectado: ${getResponseCodeMessage(responseCode)}. Se ejecutó una reversa automática.`,
            codigoRespuesta: responseCode,
            reversaEjecutada: true,
          },
          { status: 408 }
        );
      } catch (reversaError: any) {
        console.error("=== Error al ejecutar reversa automática por código de timeout ===");
        
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "ERROR_TIMEOUT",
            codigoRespuesta: responseCode,
            mensajeRespuesta: `Timeout detectado en Paso 5 (${getResponseCodeMessage(responseCode)}). Error al ejecutar reversa: ${reversaError.message}`,
          },
        });
        
        return NextResponse.json(
          {
            success: false,
            error: `Timeout detectado pero no se pudo ejecutar la reversa automática: ${reversaError.message}`,
            codigoRespuesta: responseCode,
            reversaEjecutada: false,
            errorReversa: reversaError.message,
          },
          { status: 500 }
        );
      }
    }

    // Actualizar orden con la respuesta
    const respuestaCompleta = JSON.stringify(neopayResponse);
    const codigoRespuesta = responseCode || "ERROR";
    const mensajeRespuesta = neopayResponse.ResponseMessage || getResponseCodeMessage(responseCode);

    // Verificar si fue aprobada (ResponseCode "00" o "10" = aprobada)
    const aprobado = isApprovedResponseCode(responseCode);
    const esAutorizacionParcial = isPartialAuthorizationCode(responseCode);

    // Extraer datos para voucher
    const retrievalRefNo = neopayResponse.RetrievalRefNo || null;
    const authIdResponse = neopayResponse.AuthIdResponse || null;
    const timeLocalTrans = neopayResponse.TimeLocalTrans || null;
    const dateLocalTrans = neopayResponse.DateLocalTrans || null;
    const typeOperationVoucher = neopayResponse.TypeOperation?.toString() || null;
    
    // Construir fecha de transacción
    let fechaTransaccion: Date | null = null;
    if (timeLocalTrans && dateLocalTrans) {
      try {
        const mes = parseInt(dateLocalTrans.slice(0, 2));
        const dia = parseInt(dateLocalTrans.slice(2, 4));
        const hora = parseInt(timeLocalTrans.slice(0, 2));
        const minuto = parseInt(timeLocalTrans.slice(2, 4));
        const segundo = parseInt(timeLocalTrans.slice(4, 6));
        const año = new Date().getFullYear();
        fechaTransaccion = new Date(año, mes - 1, dia, hora, minuto, segundo);
      } catch (error) {
        console.error("Error al parsear fecha de transacción:", error);
      }
    }

    let mensajeFinal = mensajeRespuesta;
    if (esAutorizacionParcial) {
      mensajeFinal = "Autorización parcial - " + (neopayResponse.PrivateUse63?.AlternateHostResponse22 || "Fondos insuficientes para el monto completo");
    }

    // Actualizar estado de la orden
    await prisma.orden.update({
      where: { id: orden.id },
      data: {
        estadoPago: aprobado ? "APROBADO" : "RECHAZADO",
        codigoRespuesta: codigoRespuesta,
        mensajeRespuesta: mensajeFinal,
        respuestaPago: respuestaCompleta,
        estado: aprobado ? "PROCESANDO" : orden.estado,
        // Campos para voucher
        retrievalRefNo: retrievalRefNo || orden.retrievalRefNo || null,
        authIdResponse: authIdResponse || orden.authIdResponse || null,
        fechaTransaccion: fechaTransaccion || orden.fechaTransaccion || null,
        timeLocalTrans: timeLocalTrans || orden.timeLocalTrans || null,
        dateLocalTrans: dateLocalTrans || orden.dateLocalTrans || null,
        typeOperation: typeOperationVoucher || orden.typeOperation || null,
      },
    });

    if (aprobado) {
      return NextResponse.json({
        success: true,
        aprobado: true,
        ordenId: orden.id,
        mensaje: "Pago confirmado exitosamente (Paso 5 completado).",
        codigoRespuesta: codigoRespuesta,
        mensajeCatalogo: getResponseCodeMessage(responseCode),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          aprobado: false,
          error: mensajeFinal,
          codigoRespuesta: codigoRespuesta,
          mensajeCatalogo: getResponseCodeMessage(responseCode),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error general en Paso 5:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor al confirmar el pago (Paso 5).",
      },
      { status: 500 }
    );
  }
}

