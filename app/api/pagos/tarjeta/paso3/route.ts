import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmailForOrdenId } from "@/lib/email";
import {
  buildPaso3Payload,
  callNeoPayAPI,
  ejecutarReversaPaso3o5,
  getNeoPayConfig,
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

    // Usar el systemsTraceNo original de la orden (mismo que Paso 1)
    const traceNo = systemsTraceNo || orden.systemsTraceNoOriginal;
    if (!traceNo) {
      return NextResponse.json(
        { error: "Falta SystemsTraceNo de la transacción original" },
        { status: 400 }
      );
    }

    // ✅ Validar que el ReferenceId coincida con el guardado en la orden
    const referenceIdOrden = orden.referenciaPago;
    if (referenceIdOrden && referenceIdOrden !== referenceId) {
      console.warn("⚠️ ReferenceId no coincide:", {
        recibido: referenceId,
        guardado: referenceIdOrden,
      });
      // Usar el ReferenceId de la orden si está disponible
      if (referenceIdOrden) {
        console.log("Usando ReferenceId de la orden:", referenceIdOrden);
      }
    }
    const referenceIdFinal = referenceIdOrden || referenceId;

    // ✅ Obtener valores del Paso 1 desde respuestaPago
    let paso1Data: any = null;
    try {
      if (orden.respuestaPago) {
        const respuestaPago = JSON.parse(orden.respuestaPago);
        paso1Data = respuestaPago.paso1Data;
        
        if (paso1Data) {
          console.log("✅ Datos del Paso 1 recuperados:", {
            messageTypeId: paso1Data.messageTypeId,
            processingCode: paso1Data.processingCode,
            amountTrans: paso1Data.amountTrans,
            cardType: paso1Data.cardType,
            tieneBillTo: !!paso1Data.billTo,
          });
        } else {
          console.warn("⚠️ respuestaPago existe pero paso1Data no está presente");
          console.warn("Estructura de respuestaPago:", Object.keys(respuestaPago));
          // Si paso1Data no existe, intentar construir desde la respuesta completa
          // IMPORTANTE: El MessageTypeId debe ser "0200" (request), no "0210" (response)
          if (respuestaPago.SystemsTraceNo) {
            console.log("⚠️ Intentando construir paso1Data desde respuestaPago...");
            paso1Data = {
              messageTypeId: "0200", // ✅ Siempre "0200" para el Paso 3 (request), no "0210" (response)
              processingCode: respuestaPago.ProcessingCode || "000000",
              systemsTraceNo: respuestaPago.SystemsTraceNo,
              posEntryMode: "012", // Valor por defecto según el manual
              nii: "003", // Valor por defecto según el manual
              posConditionCode: "00", // Valor por defecto según el manual
              orderInformation: respuestaPago.OrderInformation || "",
              additionalData: respuestaPago.AdditionalData || "",
              amountTrans: respuestaPago.AmountTrans || Math.round(Number(orden.total) * 100).toString(),
              cardType: "001", // Valor por defecto
            };
            console.log("✅ paso1Data construido desde respuestaPago");
            console.log("⚠️ Usando valores por defecto para posEntryMode, nii, posConditionCode");
          }
        }
      } else {
        console.warn("⚠️ No se encontró respuestaPago en la orden");
      }
    } catch (error) {
      console.error("❌ Error al obtener los valores del Paso 1:", error);
      console.error("respuestaPago raw:", orden.respuestaPago?.substring(0, 200));
    }

    // Log de configuración (útil para depurar -4 en producción)
    const configPaso3 = getNeoPayConfig();
    console.log("=== Paso 3 - Config ===");
    console.log("apiUrl (host):", configPaso3.apiUrl?.replace(/https?:\/\//, "").split("/")[0]);
    console.log("urlCommerce (callback):", configPaso3.urlCommerce);

    // Construir payload para Paso 3 usando valores del Paso 1 si están disponibles
    const payload = buildPaso3Payload({
      systemsTraceNo: traceNo,
      referenceId: referenceIdFinal, // ✅ Usar ReferenceId validado
      messageTypeId: paso1Data?.messageTypeId,
      processingCode: paso1Data?.processingCode,
      posEntryMode: paso1Data?.posEntryMode,
      nii: paso1Data?.nii,
      posConditionCode: paso1Data?.posConditionCode,
      orderInformation: paso1Data?.orderInformation,
      additionalData: paso1Data?.additionalData,
      // ✅ Incluir datos adicionales necesarios
      amountTrans: paso1Data?.amountTrans || Math.round(Number(orden.total) * 100).toString(), // Fallback al monto de la orden
      cardType: paso1Data?.cardType,
      billTo: paso1Data?.billTo,
    });

    // Log del payload para debugging
    console.log("=== Payload Paso 3 ===");
    console.log("SystemsTraceNo:", payload.SystemsTraceNo);
    console.log("ReferenceId:", payload.PayerAuthentication?.ReferenceId);
    console.log("Step:", payload.PayerAuthentication?.Step);
    console.log("AmountTrans:", payload.Amount?.AmountTrans, "(vacío según manual)");
    console.log("Card.Type:", payload.Card?.Type, "(vacío según manual)");
    console.log("BillTo:", "(vacío según manual)");

    // Llamar a NeoPay con manejo de timeout
    let neopayResponse: any;
    let reversaEjecutada = false;
    
    try {
      // Usar timeout de 90 segundos para el Paso 3 porque NeoPay puede estar esperando
      // la respuesta de Cardinal Commerce, lo cual puede tardar más tiempo
      neopayResponse = await callNeoPayAPI(payload, request.headers, 60000); // 60 segundos - timeout requiere reversa automática
    } catch (error: any) {
      // Si hay timeout, ejecutar reversa automática
      // Según el manual: enviar los MISMOS valores del Paso 3, solo cambiar MessageTypeId a "0400"
      if (error.isTimeout) {
        console.error("=== Timeout detectado en Paso 3, ejecutando reversa automática ===");
        
        try {
          await ejecutarReversaPaso3o5(payload, request.headers);
          reversaEjecutada = true;
          
          // Actualizar orden con estado de reversa
          await prisma.orden.update({
            where: { id: orden.id },
            data: {
              estadoPago: "REVERSADO",
              codigoRespuesta: "TIMEOUT",
              mensajeRespuesta: "Transacción excedió el tiempo límite en Paso 3. Reversa automática ejecutada.",
            },
          });
          
          return NextResponse.json(
            {
              success: false,
              error: "La transacción excedió el tiempo límite. Se ejecutó una reversa automática.",
              reversaEjecutada: true,
            },
            { status: 408 } // 408 Request Timeout
          );
        } catch (reversaError: any) {
          console.error("=== Error al ejecutar reversa automática ===");
          console.error("Error:", reversaError);
          
          // Actualizar orden con error de reversa
          await prisma.orden.update({
            where: { id: orden.id },
            data: {
              estadoPago: "ERROR_TIMEOUT",
              codigoRespuesta: "TIMEOUT",
              mensajeRespuesta: `Timeout en Paso 3. Error al ejecutar reversa: ${reversaError.message}`,
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
      
      // Re-lanzar otros errores
      throw error;
    }

    // Log de la respuesta completa para debugging
    console.log("=== Respuesta de NeoPay (Paso 3) ===");
    console.log("ResponseCode:", neopayResponse.ResponseCode);
    console.log("ResponseMessage:", neopayResponse.ResponseMessage);
    console.log("TypeOperation:", neopayResponse.TypeOperation);
    console.log("Step:", neopayResponse.PayerAuthentication?.Step);
    console.log("Respuesta completa:", JSON.stringify(neopayResponse, null, 2));

    // Extraer códigos de respuesta
    const responseCode = neopayResponse.ResponseCode?.toString();
    const typeOperation = neopayResponse.TypeOperation?.toString();
    const step = neopayResponse.PayerAuthentication?.Step?.toString();

    // ✅ Detectar códigos de timeout (68, 91, 98) y ejecutar reversa automática
    // Según el manual: enviar los MISMOS valores del Paso 3, solo cambiar MessageTypeId a "0400"
    if (responseCode && isTimeoutResponseCode(responseCode)) {
      console.error("=== Código de timeout detectado en Paso 3, ejecutando reversa automática ===");
      console.error("ResponseCode:", responseCode);
      console.error("Mensaje:", getResponseCodeMessage(responseCode));
      
      try {
        await ejecutarReversaPaso3o5(payload, request.headers);
        
        // Actualizar orden con estado de reversa
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "REVERSADO",
            codigoRespuesta: responseCode,
            mensajeRespuesta: `Timeout detectado en Paso 3 (${getResponseCodeMessage(responseCode)}). Reversa automática ejecutada.`,
          },
        });
        
        return NextResponse.json(
          {
            success: false,
            error: `Timeout detectado: ${getResponseCodeMessage(responseCode)}. Se ejecutó una reversa automática.`,
            codigoRespuesta: responseCode,
            reversaEjecutada: true,
          },
          { status: 408 } // 408 Request Timeout
        );
      } catch (reversaError: any) {
        console.error("=== Error al ejecutar reversa automática por código de timeout ===");
        console.error("Error:", reversaError);
        
        // Actualizar orden con error de reversa
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "ERROR_TIMEOUT",
            codigoRespuesta: responseCode,
            mensajeRespuesta: `Timeout detectado en Paso 3 (${getResponseCodeMessage(responseCode)}). Error al ejecutar reversa: ${reversaError.message}`,
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
    
    // Priorizar AlternateHostResponse22 si está disponible (contiene mensajes más específicos de NeoPay)
    const alternateHostResponse = neopayResponse.PrivateUse63?.AlternateHostResponse22 || "";
    const mensajeRespuesta = alternateHostResponse || 
                              neopayResponse.ResponseMessage || 
                              getResponseCodeMessage(responseCode);

    // ✅ Manejar código -4 "ERROR GENERAL EN 3D SECURE" (común en producción por URL de callback o configuración)
    if (responseCode === "-4") {
      const config = getNeoPayConfig();
      console.error("=== Código -4 ERROR GENERAL EN 3D SECURE ===");
      console.error("Verificar en producción:");
      console.error("  1. NEOPAY_URL_COMMERCE debe ser exactamente la URL de callback en producción:", config.urlCommerce);
      console.error("  2. La URL debe ser HTTPS y accesible desde internet");
      console.error("  3. Paso 1 y Paso 3 deben usar las mismas credenciales (NEOPAY_PROD_*)");
      console.error("  4. Si persiste, contactar a NeoPay con ReferenceId:", referenceIdFinal, "SystemsTraceNo:", traceNo);

      await prisma.orden.update({
        where: { id: orden.id },
        data: {
          estadoPago: "ERROR",
          codigoRespuesta: "-4",
          mensajeRespuesta: "ERROR GENERAL EN 3D SECURE. Verificar NEOPAY_URL_COMMERCE en producción.",
        },
      });

      return NextResponse.json(
        {
          success: false,
          aprobado: false,
          error: "TRANSACTION DENIED",
          codigoRespuesta: "-4",
          mensajeCatalogo: "ERROR GENERAL EN 3D SECURE",
          mensajeRespuesta: "En producción, verifica que NEOPAY_URL_COMMERCE sea la URL real de callback (ej: https://tudominio.com/pago/3dsecure/callback). Si el problema continúa, contacta a NeoPay con el número de orden.",
        },
        { status: 400 }
      );
    }

    // ✅ Manejar el caso "STEP ALREADY DONE" o "INVALID AUTHENTICATION" (ResponseCode "-3")
    // Si el paso ya se completó o hay un error de autenticación, verificar el estado de la orden
    // Reutilizar alternateHostResponse declarado arriba
    const isStepAlreadyDone = alternateHostResponse.includes("STEP ALREADY DONE");
    const isInvalidAuth = alternateHostResponse.includes("INVALID AUTHENTICATION");
    
    if (responseCode === "-3" && (isStepAlreadyDone || isInvalidAuth)) {
      if (isStepAlreadyDone) {
        console.log("⚠️ Paso 3 ya fue ejecutado anteriormente para este ReferenceId");
        // Re-fetch la orden por si otra petición (doble envío/recarga) ya la actualizó a APROBADO
        const ordenActualizada = await prisma.orden.findUnique({
          where: { id: orden.id },
          select: { estadoPago: true },
        });
        const estadoActual = ordenActualizada?.estadoPago ?? orden.estadoPago;

        if (estadoActual === "APROBADO") {
          console.log("✅ La orden ya está aprobada, retornando éxito");
          return NextResponse.json({
            success: true,
            aprobado: true,
            ordenId: orden.id,
            mensaje: "El pago ya fue procesado exitosamente anteriormente.",
          });
        }

        // Paso 3 ya ejecutado en NeoPay pero la orden no está APROBADA aquí (ej. doble envío, primera respuesta se perdió)
        // Devolver 200 con flag para que el usuario pueda ir a "Ver mi orden" y comprobar
        return NextResponse.json({
          success: false,
          aprobado: false,
          stepAlreadyDone: true,
          ordenId: orden.id,
          error: "Esta transacción ya fue procesada en el banco. Si descontaron el monto de tu tarjeta, revisa el estado de tu orden.",
          codigoRespuesta: responseCode,
          mensajeRespuesta: alternateHostResponse || "STEP ALREADY DONE",
        });
      }
      
      if (isInvalidAuth) {
        console.error("❌ INVALID AUTHENTICATION - NeoPay no recibió la respuesta de Cardinal Commerce");
        console.error("Esto puede indicar que:");
        console.error("1. Cardinal Commerce no notificó a NeoPay a tiempo");
        console.error("2. El ReferenceId no es válido o expiró");
        console.error("3. Hay un problema de comunicación entre Cardinal Commerce y NeoPay");
        
        // Actualizar orden con el error
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "ERROR",
            codigoRespuesta: responseCode,
            mensajeRespuesta: "INVALID AUTHENTICATION - NeoPay no recibió la respuesta de Cardinal Commerce. La autenticación 3DSecure puede no haberse completado correctamente.",
          },
        });
        
        return NextResponse.json(
          {
            success: false,
            error: "La autenticación 3DSecure no se completó correctamente. NeoPay no recibió la respuesta de Cardinal Commerce. Por favor intenta nuevamente.",
            codigoRespuesta: responseCode,
            mensajeRespuesta: alternateHostResponse || "INVALID AUTHENTICATION",
          },
          { status: 400 }
        );
      }
    }

    // ✅ Validaciones según el manual para Paso 3
    // Verificar TypeOperation
    if (typeOperation && !["1", "3", "4"].includes(typeOperation)) {
      console.error("=== TypeOperation no válido en Paso 3 ===");
      console.error("TypeOperation:", typeOperation);
      
      await prisma.orden.update({
        where: { id: orden.id },
        data: {
          estadoPago: "ERROR",
          codigoRespuesta: codigoRespuesta,
          mensajeRespuesta: `TypeOperation no válido en Paso 3: ${typeOperation}`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: `TypeOperation no válido: ${typeOperation}`,
          codigoRespuesta: codigoRespuesta,
        },
        { status: 400 }
      );
    }

    // ✅ Si requiere Paso 4 (autenticación adicional con PIN), preparar para Paso 4
    const requierePaso4 = step === "4" && 
                          neopayResponse.PayerAuthentication?.AccessToken && 
                          neopayResponse.PayerAuthentication?.DeviceDataCollectionUrl;
    
    if (requierePaso4) {
      console.log("=== Paso 4 requerido (autenticación adicional con PIN) ===");
      console.log("ReferenceId:", neopayResponse.PayerAuthentication?.ReferenceId);
      console.log("DirectoryServerTransactionId:", neopayResponse.PayerAuthentication?.DirectoryServerTransactionId);
      
      // Guardar datos del Paso 3 en respuestaPago para usar en Paso 5
      const respuestaPagoActual = orden.respuestaPago ? JSON.parse(orden.respuestaPago) : {};
      respuestaPagoActual.paso3Data = {
        messageTypeId: paso1Data?.messageTypeId || "0200",
        processingCode: paso1Data?.processingCode || "000000",
        systemsTraceNo: traceNo,
        posEntryMode: paso1Data?.posEntryMode || "012",
        nii: paso1Data?.nii || "003",
        posConditionCode: paso1Data?.posConditionCode || "00",
        orderInformation: paso1Data?.orderInformation || "",
        additionalData: paso1Data?.additionalData || "",
        directoryServerTransactionId: neopayResponse.PayerAuthentication?.DirectoryServerTransactionId || "",
      };
      
      // Actualizar orden con la respuesta del Paso 3 (sin cambiar estadoPago aún)
      await prisma.orden.update({
        where: { id: orden.id },
        data: {
          respuestaPago: JSON.stringify(respuestaPagoActual),
          // No cambiar estadoPago, se actualizará en Paso 5
        },
      });
      
      // Retornar respuesta indicando que se requiere Paso 4
      return NextResponse.json(
        {
          success: true,
          requierePaso4: true,
          ordenId: orden.id,
          accessToken: neopayResponse.PayerAuthentication.AccessToken,
          deviceDataCollectionUrl: neopayResponse.PayerAuthentication.DeviceDataCollectionUrl,
          referenceId: neopayResponse.PayerAuthentication.ReferenceId,
          directoryServerTransactionId: neopayResponse.PayerAuthentication.DirectoryServerTransactionId,
          mensaje: "Se requiere autenticación adicional (Paso 4). Redirigiendo...",
        },
        { status: 200 }
      );
    }

    // Verificar si fue aprobada (ResponseCode "00" o "10" = aprobada)
    const aprobado = isApprovedResponseCode(responseCode);
    const esAutorizacionParcial = isPartialAuthorizationCode(responseCode);

    // Extraer datos para voucher
    const retrievalRefNo = neopayResponse.RetrievalRefNo || null;
    const authIdResponse = neopayResponse.AuthIdResponse || null;
    const timeLocalTrans = neopayResponse.TimeLocalTrans || null;
    const dateLocalTrans = neopayResponse.DateLocalTrans || null;
    const typeOperationVoucher = neopayResponse.TypeOperation?.toString() || null;
    
    // Construir fecha de transacción si tenemos timeLocalTrans y dateLocalTrans
    let fechaTransaccion: Date | null = null;
    if (timeLocalTrans && dateLocalTrans) {
      try {
        // dateLocalTrans es MMDD, timeLocalTrans es HHMMSS
        const mes = parseInt(dateLocalTrans.slice(0, 2));
        const dia = parseInt(dateLocalTrans.slice(2, 4));
        const hora = parseInt(timeLocalTrans.slice(0, 2));
        const minuto = parseInt(timeLocalTrans.slice(2, 4));
        const segundo = parseInt(timeLocalTrans.slice(4, 6));
        
        // Asumimos año actual (o podríamos usar el año de la orden)
        const año = new Date().getFullYear();
        fechaTransaccion = new Date(año, mes - 1, dia, hora, minuto, segundo);
      } catch (error) {
        console.error("Error al parsear fecha de transacción:", error);
      }
    }

    // Construir mensaje final (ya tenemos mensajeRespuesta con prioridad correcta arriba)
    let mensajeFinal = mensajeRespuesta;
    if (esAutorizacionParcial) {
      mensajeFinal = "Autorización parcial - " + (alternateHostResponse || "Fondos insuficientes para el monto completo");
    }

    // Obtener la orden actualizada para verificar si ya tiene los campos
    const ordenActualizada = await prisma.orden.findUnique({
      where: { id: orden.id },
      select: {
        retrievalRefNo: true,
        authIdResponse: true,
        fechaTransaccion: true,
        timeLocalTrans: true,
        dateLocalTrans: true,
        typeOperation: true,
      },
    });

    // Preservar paso1Data (incluye additionalData/cuotas para voucher) al actualizar respuestaPago
    let respuestaParaGuardar = respuestaCompleta;
    if (orden.respuestaPago) {
      try {
        const existente = JSON.parse(orden.respuestaPago);
        const nuevaRespuesta = JSON.parse(respuestaCompleta);
        respuestaParaGuardar = JSON.stringify({
          ...nuevaRespuesta,
          paso1Data: existente.paso1Data ?? nuevaRespuesta.paso1Data,
        });
      } catch {
        /* usar respuestaCompleta tal cual */
      }
    }

    await prisma.orden.update({
      where: { id: orden.id },
      data: {
        respuestaPago: respuestaParaGuardar,
        estadoPago: aprobado ? "APROBADO" : "RECHAZADO",
        codigoRespuesta: codigoRespuesta,
        mensajeRespuesta: mensajeFinal,
        estado: aprobado ? "PROCESANDO" : orden.estado,
        // Campos para voucher (usar los nuevos si están disponibles, sino mantener los existentes)
        retrievalRefNo: retrievalRefNo || ordenActualizada?.retrievalRefNo || null,
        authIdResponse: authIdResponse || ordenActualizada?.authIdResponse || null,
        fechaTransaccion: fechaTransaccion || ordenActualizada?.fechaTransaccion || null,
          timeLocalTrans: timeLocalTrans || ordenActualizada?.timeLocalTrans || null,
          dateLocalTrans: dateLocalTrans || ordenActualizada?.dateLocalTrans || null,
          typeOperation: typeOperationVoucher || ordenActualizada?.typeOperation || null,
      },
    });

    if (aprobado) {
      // Enviar email de confirmación solo cuando pago aprobado
      try {
        await sendOrderConfirmationEmailForOrdenId(orden.id);
      } catch (emailError: any) {
        console.error("Error al enviar email de confirmación (Paso 3 aprobado):", emailError);
      }
      return NextResponse.json({
        success: true,
        aprobado: true,
        ordenId: orden.id,
        mensaje: "Pago confirmado exitosamente",
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
    console.error("Error en Paso 3 de pago con tarjeta:", error);
    return NextResponse.json(
      {
        error: error.message || "Error al confirmar el pago con tarjeta",
      },
      { status: 500 }
    );
  }
}

