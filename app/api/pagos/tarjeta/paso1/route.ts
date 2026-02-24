import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmailForOrdenId } from "@/lib/email";
import {
  buildPaso1Payload,
  cuotasToAdditionalData,
  callNeoPayAPI,
  getLast4Digits,
  getCardType,
  ejecutarReversaAutomatica,
  getResponseCodeMessage,
  isTimeoutResponseCode,
  isApprovedResponseCode,
  isPartialAuthorizationCode,
  generateSystemsTraceNo,
} from "@/lib/neopay";
import { getNextSystemsTraceNo } from "@/lib/systemTraceNo";
import { Prisma } from "@/app/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ordenId,
      tarjeta,
      cliente,
      monto,
      cuotas, // Opcional: número de cuotas para NeoCuotas (3, 6, 10, 12, 18, 24). null/undefined = contado
    } = body;

    // Validar datos requeridos
    if (!ordenId || !tarjeta || !cliente || !monto) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    if (!tarjeta.numero || !tarjeta.fechaVencimiento || !tarjeta.cvv) {
      return NextResponse.json(
        { error: "Faltan datos de la tarjeta" },
        { status: 400 }
      );
    }

    // Validar formato de fecha (YYMM)
    if (!/^\d{4}$/.test(tarjeta.fechaVencimiento)) {
      return NextResponse.json(
        { error: "Formato de fecha de vencimiento inválido. Use YYMM (ej: 2912)" },
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

    // Obtener SystemsTraceNo correlativo cíclico (000001-999999)
    // Fallback a aleatorio si la tabla ConfiguracionSistema no existe (migración pendiente)
    let systemsTraceNo: string;
    try {
      systemsTraceNo = await getNextSystemsTraceNo();
    } catch (err) {
      console.warn("ConfiguracionSistema no disponible, usando SystemsTraceNo aleatorio:", err);
      systemsTraceNo = generateSystemsTraceNo();
    }

    // Obtener URL de retorno
    const config = await import("@/lib/neopay").then(m => m.getNeoPayConfig());
    console.log("=== Paso 1 - Config ===", {
      apiHost: config.apiUrl?.replace(/https?:\/\//, "").split("/")[0],
      urlCommerce: config.urlCommerce,
    });

    // Construir AdditionalData para NeoCuotas si se seleccionaron cuotas
    const additionalData = cuotasToAdditionalData(cuotas);

    // Construir payload para Paso 1
    const payload = buildPaso1Payload(
      tarjeta,
      cliente,
      monto,
      systemsTraceNo,
      config.urlCommerce,
      additionalData || undefined
    );

    // Llamar a NeoPay con manejo de timeout
    let neopayResponse: any;
    let reversaEjecutada = false;
    
    try {
      neopayResponse = await callNeoPayAPI(payload, request.headers);
    } catch (error: any) {
      // Si hay timeout, ejecutar reversa automática
      if (error.isTimeout) {
        console.error("=== Timeout detectado, ejecutando reversa automática ===");
        
        try {
          const reversaData = {
            systemsTraceNoOriginal: systemsTraceNo,
            montoOriginal: monto,
            retrievalRefNo: undefined,
          };
          
          await ejecutarReversaAutomatica(reversaData, request.headers);
          reversaEjecutada = true;
          
          // Actualizar orden con estado de reversa
          await prisma.orden.update({
            where: { id: orden.id },
            data: {
              estadoPago: "REVERSADO",
              codigoRespuesta: "TIMEOUT",
              mensajeRespuesta: "Transacción excedió el tiempo límite. Reversa automática ejecutada.",
              systemsTraceNoOriginal: systemsTraceNo,
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
              mensajeRespuesta: `Timeout en transacción. Error al ejecutar reversa: ${reversaError.message}`,
              systemsTraceNoOriginal: systemsTraceNo,
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
    console.log("=== Respuesta de NeoPay (Paso 1) ===");
    console.log("ResponseCode:", neopayResponse.ResponseCode);
    console.log("ResponseMessage:", neopayResponse.ResponseMessage);
    console.log("TypeOperation:", neopayResponse.TypeOperation);
    console.log("PayerAuthentication:", neopayResponse.PayerAuthentication);
    console.log("Respuesta completa:", JSON.stringify(neopayResponse, null, 2));

    // Extraer códigos de respuesta
    const responseCode = neopayResponse.ResponseCode?.toString();
    const typeOperation = neopayResponse.TypeOperation?.toString();
    const step = neopayResponse.PayerAuthentication?.Step?.toString();

    // ✅ Detectar códigos de timeout (68, 91, 98) y ejecutar reversa automática
    if (responseCode && isTimeoutResponseCode(responseCode)) {
      console.error("=== Código de timeout detectado, ejecutando reversa automática ===");
      console.error("ResponseCode:", responseCode);
      console.error("Mensaje:", getResponseCodeMessage(responseCode));
      
      try {
        const reversaData = {
          systemsTraceNoOriginal: systemsTraceNo,
          montoOriginal: monto,
          retrievalRefNo: neopayResponse.RetrievalRefNo || undefined,
        };
        
        await ejecutarReversaAutomatica(reversaData, request.headers);
        
        // Actualizar orden con estado de reversa
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "REVERSADO",
            codigoRespuesta: responseCode,
            mensajeRespuesta: `Timeout detectado (${getResponseCodeMessage(responseCode)}). Reversa automática ejecutada.`,
            systemsTraceNoOriginal: systemsTraceNo,
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
            mensajeRespuesta: `Timeout detectado (${getResponseCodeMessage(responseCode)}). Error al ejecutar reversa: ${reversaError.message}`,
            systemsTraceNoOriginal: systemsTraceNo,
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

    // Guardar información del pago en la orden
    const numeroTarjeta = getLast4Digits(tarjeta.numero);
    const tipoTarjeta = getCardType(tarjeta.numero);

    // Extraer datos para voucher
    const retrievalRefNo = neopayResponse.RetrievalRefNo || null;
    const authIdResponse = neopayResponse.AuthIdResponse || null;
    const timeLocalTrans = neopayResponse.TimeLocalTrans || null;
    const dateLocalTrans = neopayResponse.DateLocalTrans || null;
    
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

    // Guardar valores del Paso 1 en respuestaPago (JSON) para usar en Paso 3
    // Según el manual, el Paso 3 debe usar los mismos valores del Paso 1
    const paso1Data = {
      messageTypeId: payload.MessageTypeId,
      processingCode: payload.ProcessingCode,
      systemsTraceNo: systemsTraceNo,
      posEntryMode: payload.PosEntryMode,
      nii: payload.Nii,
      posConditionCode: payload.PosConditionCode,
      orderInformation: payload.OrderInformation || "",
      additionalData: payload.AdditionalData || "",
      // ✅ Guardar datos necesarios para Paso 3
      amountTrans: payload.Amount.AmountTrans, // Monto en centavos
      cardType: payload.Card.Type,
      billTo: payload.BillTo, // Datos del cliente
    };

    await prisma.orden.update({
      where: { id: orden.id },
      data: {
        numeroTarjeta: `****${numeroTarjeta}`,
        tipoTarjeta: tipoTarjeta,
        respuestaPago: JSON.stringify({
          ...neopayResponse,
          paso1Data, // ✅ Guardar valores del Paso 1 para usar en Paso 3
        }),
        estadoPago: "PENDIENTE",
        referenciaPago: neopayResponse.PayerAuthentication?.ReferenceId || null,
        systemsTraceNoOriginal: systemsTraceNo, // Guardar para anulaciones
        // Campos para voucher
        retrievalRefNo: retrievalRefNo,
        authIdResponse: authIdResponse,
        fechaTransaccion: fechaTransaccion,
        timeLocalTrans: timeLocalTrans,
        dateLocalTrans: dateLocalTrans,
        typeOperation: typeOperation,
      },
    });

    // Verificar si requiere 3DSecure
    const requiere3DSecure = step === "2" ||
                             step === "4" ||
                             (neopayResponse.PayerAuthentication?.AccessToken && neopayResponse.PayerAuthentication?.DeviceDataCollectionUrl);

    // ✅ Validaciones según el manual para 3D Secure
    if (requiere3DSecure) {
      // Validar TypeOperation === 3 para 3D Secure
      if (typeOperation !== "3") {
        console.error("=== TypeOperation incorrecto para 3D Secure ===");
        console.error("Esperado: 3, Recibido:", typeOperation);
        
        const mensajeError = `TypeOperation incorrecto para 3D Secure. Esperado: 3, Recibido: ${typeOperation}`;
        
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "ERROR",
            codigoRespuesta: responseCode || "ERROR",
            mensajeRespuesta: mensajeError,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: mensajeError,
            codigoRespuesta: responseCode,
          },
          { status: 400 }
        );
      }

      // Validar ResponseCode === "00" para 3D Secure (no "10")
      if (responseCode !== "00") {
        console.error("=== ResponseCode incorrecto para 3D Secure ===");
        console.error("Esperado: 00, Recibido:", responseCode);
        
        const mensajeError = getResponseCodeMessage(responseCode);
        
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "RECHAZADO",
            codigoRespuesta: responseCode || "ERROR",
            mensajeRespuesta: `3D Secure rechazado: ${mensajeError}`,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: `3D Secure rechazado: ${mensajeError}`,
            codigoRespuesta: responseCode,
            mensaje: mensajeError,
          },
          { status: 400 }
        );
      }

      // Validar Step === "2" para proceder al Paso 2
      if (step !== "2") {
        console.error("=== Step incorrecto para proceder al Paso 2 ===");
        console.error("Esperado: 2, Recibido:", step);
        
        const mensajeError = `Step incorrecto. Esperado: 2, Recibido: ${step}. No se puede proceder al Paso 2.`;
        
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: "ERROR",
            codigoRespuesta: responseCode || "ERROR",
            mensajeRespuesta: mensajeError,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: mensajeError,
            codigoRespuesta: responseCode,
            step: step,
          },
          { status: 400 }
        );
      }
    }

    // Verificar si fue aprobada (ResponseCode "00" o "10" = aprobada)
    const aprobada = isApprovedResponseCode(responseCode);
    const esAutorizacionParcial = isPartialAuthorizationCode(responseCode);

    // Si la transacción fue aprobada directamente (sin 3DSecure)
    if (!requiere3DSecure && aprobada) {
      let mensajeAprobacion = neopayResponse.ResponseMessage || getResponseCodeMessage(responseCode);
      if (esAutorizacionParcial) {
        mensajeAprobacion = "Autorización parcial - " + (neopayResponse.PrivateUse63?.AlternateHostResponse22 || "Fondos insuficientes para el monto completo");
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

      await prisma.orden.update({
        where: { id: orden.id },
        data: {
          estadoPago: "APROBADO",
          codigoRespuesta: neopayResponse.ResponseCode,
          mensajeRespuesta: mensajeAprobacion,
          estado: "PROCESANDO",
          // Actualizar campos de voucher si no se guardaron antes
          retrievalRefNo: retrievalRefNo || ordenActualizada?.retrievalRefNo || null,
          authIdResponse: authIdResponse || ordenActualizada?.authIdResponse || null,
          fechaTransaccion: fechaTransaccion || ordenActualizada?.fechaTransaccion || null,
          timeLocalTrans: timeLocalTrans || ordenActualizada?.timeLocalTrans || null,
          dateLocalTrans: dateLocalTrans || ordenActualizada?.dateLocalTrans || null,
          typeOperation: typeOperation || ordenActualizada?.typeOperation || null,
        },
      });

      // Enviar email de confirmación solo cuando pago aprobado
      try {
        await sendOrderConfirmationEmailForOrdenId(orden.id);
      } catch (emailError: any) {
        console.error("Error al enviar email de confirmación (pago aprobado):", emailError);
      }

      return NextResponse.json({
        success: true,
        aprobado: true,
        ordenId: orden.id,
        mensaje: "Pago aprobado exitosamente",
      });
    }

    // Si requiere 3DSecure
    if (requiere3DSecure) {
      // Construir el HTML del formulario 3DSecure
      const accessToken = neopayResponse.PayerAuthentication?.AccessToken;
      const deviceDataCollectionUrl = neopayResponse.PayerAuthentication?.DeviceDataCollectionUrl || 
                                      "https://centinelapistag.cardinalcommerce.com/V1/Cruise/Collect";
      const referenceId = neopayResponse.PayerAuthentication?.ReferenceId;

      // Si ya viene HTML pre-construido, usarlo; si no, construir el formulario
      let htmlForm = neopayResponse.PayerAuthentication?.Html;
      
      if (!htmlForm && accessToken) {
        // Construir el formulario HTML según el ejemplo de PaymentForm.html
        htmlForm = `
<html>
<head>
  <title>3D Secure Authentication</title>
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
</head>
<body>
  <iframe name="ddc-iframe" height="1" width="1" style="display: none;"></iframe>
  <form id="ddc-form" target="ddc-iframe" method="POST" action="${deviceDataCollectionUrl}">
    <input type="hidden" name="JWT" value="${accessToken}" />
  </form>
</body>
<script>
window.onload = function() {
  var ddcForm = document.querySelector('#ddc-form');
  if(ddcForm) {
    ddcForm.submit();
  }
}
</script>
<script>
window.addEventListener("message", (event) => {
  if (event.origin === "https://centinelapistag.cardinalcommerce.com" || 
      event.origin === "https://centinelapi.cardinalcommerce.com") {
    try {
      let data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      console.log('Merchant received a message:', data);
      
      if (data !== undefined && data.Status) {
        console.log('Songbird ran DF successfully');
        // Enviar mensaje al parent window
        if (window.parent) {
          window.parent.postMessage(data, '*');
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
}, false);
</script>
</html>`;
      }

      return NextResponse.json({
        success: true,
        requiere3DSecure: true,
        ordenId: orden.id,
        referenceId: referenceId,
        html: htmlForm,
        systemsTraceNo: systemsTraceNo,
        accessToken: accessToken,
        deviceDataCollectionUrl: deviceDataCollectionUrl,
      });
    }

    // Si fue rechazada
    const codigoRespuesta = responseCode || "ERROR";
    const mensajeRespuesta = neopayResponse.ResponseMessage || getResponseCodeMessage(responseCode);
    const detallesAdicionales = neopayResponse.ErrorMessage || neopayResponse.Error || null;

    console.error("=== Transacción Rechazada ===");
    console.error("Código:", codigoRespuesta);
    console.error("Mensaje:", mensajeRespuesta);
    console.error("Mensaje del catálogo:", getResponseCodeMessage(responseCode));
    console.error("Detalles adicionales:", detallesAdicionales);
    console.error("Respuesta completa:", JSON.stringify(neopayResponse, null, 2));

    await prisma.orden.update({
      where: { id: orden.id },
      data: {
        estadoPago: "RECHAZADO",
        codigoRespuesta: codigoRespuesta,
        mensajeRespuesta: mensajeRespuesta + (detallesAdicionales ? ` - ${detallesAdicionales}` : ""),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: mensajeRespuesta,
        codigoRespuesta: codigoRespuesta,
        mensajeCatalogo: getResponseCodeMessage(responseCode),
        detalles: detallesAdicionales,
        respuestaCompleta: neopayResponse, // En desarrollo, incluir respuesta completa para debugging
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error en Paso 1 de pago con tarjeta:", error);
    return NextResponse.json(
      {
        error: error.message || "Error al procesar el pago con tarjeta",
      },
      { status: 500 }
    );
  }
}

