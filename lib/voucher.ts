import PDFDocument from "pdfkit";

interface VoucherData {
  // Información de la orden
  numeroOrden: string;
  fechaOrden: Date;
  estado: string;
  subtotal: number;
  envio: number;
  total: number;
  
  // Información del cliente
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string | null;
  direccionEnvio: string | null;
  ciudadEnvio: string | null;
  
  // Información del pago
  metodoPago: string;
  cuotas: number | null; // Número de cuotas (NeoCuotas), null = contado
  estadoPago: string | null;
  numeroTarjeta: string | null; // Últimos 4 dígitos
  tipoTarjeta: string | null;
  retrievalRefNo: string | null; // Número de Referencia (12 dígitos)
  authIdResponse: string | null; // Número de Autorización (6 caracteres)
  systemsTraceNo: string | null; // Número de Auditoría
  afiliacion: string | null; // CardAcqId (Afiliación del comercio)
  fechaTransaccion: Date | null;
  timeLocalTrans: string | null; // HHMMSS
  dateLocalTrans: string | null; // MMDD
  typeOperation: string | null;
  
  // Items de la orden
  items: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  
  // Si es anulación, el monto debe ser negativo
  esAnulacion?: boolean;
}

/**
 * Genera un PDF voucher/comprobante de pago
 */
export async function generarVoucherPDF(data: VoucherData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Usar las fuentes estándar de PDF que no requieren archivos externos
      const doc = new PDFDocument({
        size: "LETTER",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
        // No especificar font aquí, usar las fuentes estándar
      });

      const chunks: Buffer[] = [];
      
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Título (usar fuente estándar sin especificar nombre)
      doc.fontSize(20).text(data.esAnulacion ? "COMPROBANTE DE ANULACIÓN" : "COMPROBANTE DE PAGO", { align: "center" });
      doc.moveDown();

      // Información de la orden
      doc.fontSize(12);
      doc.text(`Número de Orden: ${data.numeroOrden}`, { continued: false });
      
      // Usar fecha de transacción de NeoPay si existe, de lo contrario fecha de la orden
      let fechaMostrar: Date = data.fechaOrden;
      if (data.metodoPago === "TARJETA") {
        if (data.fechaTransaccion) {
          fechaMostrar = data.fechaTransaccion;
        } else if (data.dateLocalTrans && data.timeLocalTrans) {
          // Construir fecha desde dateLocalTrans (MMDD) y timeLocalTrans (HHMMSS)
          const mes = parseInt(data.dateLocalTrans.slice(0, 2));
          const dia = parseInt(data.dateLocalTrans.slice(2, 4));
          const hora = parseInt(data.timeLocalTrans.slice(0, 2));
          const minuto = parseInt(data.timeLocalTrans.slice(2, 4));
          const segundo = parseInt(data.timeLocalTrans.slice(4, 6));
          const anio = new Date().getFullYear();
          fechaMostrar = new Date(anio, mes - 1, dia, hora, minuto, segundo);
        }
      }
      doc.text(`Fecha: ${fechaMostrar.toLocaleString("es-GT", { 
        year: "numeric", 
        month: "2-digit", 
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/Guatemala",
      })}`);
      doc.text(`Estado: ${data.estado}`);
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Información del cliente
      doc.fontSize(14).text("INFORMACIÓN DEL CLIENTE", { continued: false });
      doc.fontSize(12);
      doc.text(`Nombre: ${data.nombreCliente}`);
      doc.text(`Email: ${data.emailCliente}`);
      if (data.telefonoCliente) {
        doc.text(`Teléfono: ${data.telefonoCliente}`);
      }
      if (data.direccionEnvio) {
        doc.text(`Dirección: ${data.direccionEnvio}`);
      }
      if (data.ciudadEnvio) {
        doc.text(`Ciudad: ${data.ciudadEnvio}`);
      }
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Información del pago
      doc.fontSize(14).text("INFORMACIÓN DEL PAGO", { continued: false });
      doc.fontSize(12);
      doc.text(`Método de Pago: ${data.metodoPago === "TARJETA" ? "NEONET" : data.metodoPago === "TRANSFERENCIA" ? "Transferencia" : "Contra Entrega"}`);
      if (data.metodoPago === "TARJETA" && data.cuotas && data.cuotas > 1) {
        doc.text(`Cuotas: ${data.cuotas} (NeoCuotas)`);
      }
      
      if (data.metodoPago === "TARJETA") {
        if (data.numeroTarjeta) {
          doc.text(`Tarjeta: ${data.numeroTarjeta}`);
        }
        if (data.tipoTarjeta) {
          doc.text(`Tipo: ${data.tipoTarjeta}`);
        }
        if (data.retrievalRefNo) {
          doc.text(`Número de Referencia: ${data.retrievalRefNo}`);
        }
        if (data.authIdResponse) {
          doc.text(`Número de Autorización: ${data.authIdResponse}`);
        }
        if (data.systemsTraceNo) {
          doc.text(`Número de Auditoría: ${data.systemsTraceNo}`);
        }
        if (data.afiliacion) {
          doc.text(`Afiliación: ${data.afiliacion}`);
        }
        if (data.typeOperation) {
          const tipoOp = data.typeOperation === "1" ? "NeoPay" : data.typeOperation === "2" ? "TMS" : "3D Secure";
          doc.text(`Tipo de Operación: ${tipoOp}`);
        }
        if (data.estadoPago) {
          doc.text(`Estado del Pago: ${data.estadoPago}`);
        }
        doc.text("(01) Pagado Electrónicamente");
      }
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Items de la orden
      doc.fontSize(14).text("DETALLE DE PRODUCTOS", { continued: false });
      doc.moveDown(0.5);
      
      // Encabezados de tabla
      doc.fontSize(10);
      doc.text("Producto", 50, doc.y, { width: 200 });
      doc.text("Cant.", 250, doc.y, { width: 50, align: "center" });
      doc.text("Precio Unit.", 300, doc.y, { width: 100, align: "right" });
      doc.text("Subtotal", 400, doc.y, { width: 100, align: "right" });
      doc.moveDown(0.3);
      
      // Línea debajo de encabezados
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      
      // Items
      doc.fontSize(10);
      data.items.forEach((item) => {
        const startY = doc.y;
        doc.text(item.nombre, 50, startY, { width: 200 });
        doc.text(item.cantidad.toString(), 250, startY, { width: 50, align: "center" });
        doc.text(`Q ${item.precioUnitario.toFixed(2)}`, 300, startY, { width: 100, align: "right" });
        doc.text(`Q ${item.subtotal.toFixed(2)}`, 400, startY, { width: 100, align: "right" });
        doc.moveDown(0.5);
      });
      
      doc.moveDown(0.5);
      // Línea debajo de items
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Totales: etiqueta a la izquierda, valor a la derecha (evitar superposición)
      doc.fontSize(12);
      const subtotalY = doc.y;
      doc.text("Subtotal:", 350, subtotalY, { width: 100 });
      doc.text(`Q ${data.subtotal.toFixed(2)}`, 400, subtotalY, { width: 150, align: "right" });
      doc.moveDown(0.5);

      if (data.envio > 0) {
        const envioY = doc.y;
        doc.text("Envío:", 350, envioY, { width: 100 });
        doc.text(`Q ${data.envio.toFixed(2)}`, 400, envioY, { width: 150, align: "right" });
        doc.moveDown(0.5);
      }

      // Total (negativo si es anulación)
      const totalY = doc.y;
      doc.fontSize(14);
      if (data.esAnulacion) {
        doc.text("TOTAL (ANULACIÓN):", 350, totalY, { width: 100 });
        doc.text(`Q -${data.total.toFixed(2)}`, 400, totalY, { width: 150, align: "right" });
      } else {
        doc.text("TOTAL:", 350, totalY, { width: 100 });
        doc.text(`Q ${data.total.toFixed(2)}`, 400, totalY, { width: 150, align: "right" });
      }
      doc.moveDown();

      // Línea separadora final
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);

      // Nota final
      doc.fontSize(10);
      doc.text("Este documento es un comprobante de pago generado automáticamente.", { align: "center" });
      if (data.esAnulacion) {
        doc.text("Este comprobante corresponde a una anulación de transacción.", { align: "center" });
      }
      doc.moveDown();
      doc.text(
        `Generado el: ${new Date().toLocaleString("es-GT", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/Guatemala",
        })}`,
        { align: "center" }
      );

      // Finalizar documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

