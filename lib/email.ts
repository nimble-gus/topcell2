import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Inicialización lazy de Resend para evitar errores durante el build
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurada. Por favor, configura la variable de entorno RESEND_API_KEY.");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

// Tipo para los datos de una orden
interface OrdenData {
  id: number;
  numeroOrden: string;
  estado: string;
  subtotal: number;
  impuestos: number;
  envio: number;
  total: number;
  tipoEnvio: string;
  metodoPago: string;
  direccionEnvio: string;
  ciudadEnvio?: string | null;
  codigoPostalEnvio?: string | null;
  nombreRecibe?: string | null;
  telefonoRecibe?: string | null;
  notas?: string | null;
  createdAt: Date;
  usuario: {
    email: string;
    nombre: string;
    apellido?: string | null;
    telefono?: string | null;
  };
  items: Array<{
    id: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    tipoProducto: string;
    nombreProducto: string;
    variante?: string | null;
    imagenUrl?: string | null;
  }>;
}

// Función para formatear el método de pago
function formatMetodoPago(metodo: string): string {
  const metodos: Record<string, string> = {
    CONTRA_ENTREGA: "Contra Entrega",
    TRANSFERENCIA: "Transferencia Bancaria",
    TARJETA: "Tarjeta de Crédito/Débito",
  };
  return metodos[metodo] || metodo;
}

// Función para formatear el tipo de envío
function formatTipoEnvio(tipo: string): string {
  const tipos: Record<string, string> = {
    ENVIO: "Envío a Domicilio",
    RECOGER_BODEGA: "Recoger en Bodega",
  };
  return tipos[tipo] || tipo;
}

// Función para formatear el estado de la orden
function formatEstado(estado: string): string {
  const estados: Record<string, string> = {
    PENDIENTE: "Pendiente",
    PROCESANDO: "En Proceso",
    ENVIADO: "Enviado",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };
  return estados[estado] || estado;
}

// Email cuando se crea una orden
export async function sendOrdenCreatedEmail(orden: OrdenData, logoUrl?: string | null) {
  try {
    const nombreCompleto = orden.usuario.apellido
      ? `${orden.usuario.nombre} ${orden.usuario.apellido}`
      : orden.usuario.nombre;

    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="TOPCELL" style="max-width: 200px; height: auto; display: block; margin: 0 auto 15px;" />`
      : `<h1 style="color: #1a1a1a; margin: 0 0 5px 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; text-align: center;">TOPCELL</h1><p style="color: #666; margin: 0; font-size: 14px; text-align: center; letter-spacing: 1px;">TELECOMUNICACIONES</p>`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmación de Orden - TOPCELL</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Header con logo -->
                  <tr>
                    <td style="background: #ffffff; padding: 50px 40px; text-align: center; border-bottom: 2px solid #ff6b35;">
                      ${logoHtml}
                      <h2 style="color: #1a1a1a; margin: 20px 0 0 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px;">¡Gracias por tu compra!</h2>
                    </td>
                  </tr>
                  
                  <!-- Contenido principal -->
                  <tr>
                    <td style="padding: 40px 40px 30px 40px;">
                      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #333;">
                        Hola <strong style="color: #ff6b35;">${nombreCompleto}</strong>,
                      </p>
                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555;">
                        Hemos recibido tu orden correctamente. Te proporcionamos los detalles a continuación:
                      </p>
                      
                      <!-- Número de Orden destacado -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 2px solid #ff6b35; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #ff6b35; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Número de Orden</p>
                            <p style="margin: 0; font-size: 28px; font-weight: bold; color: #000000; letter-spacing: 1px;">
                              ${orden.numeroOrden}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Detalles de la Orden -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
                              Detalles de la Orden
                            </h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 12px 0; color: #666; font-size: 15px;">Estado:</td>
                                <td style="padding: 12px 0; font-weight: 600; text-align: right; color: #1a1a1a; font-size: 15px;">
                                  ${formatEstado(orden.estado)}
                                </td>
                              </tr>
                              <tr style="border-top: 1px solid #e0e0e0;">
                                <td style="padding: 12px 0; color: #666; font-size: 15px;">Método de Pago:</td>
                                <td style="padding: 12px 0; text-align: right; color: #1a1a1a; font-size: 15px;">${formatMetodoPago(orden.metodoPago)}</td>
                              </tr>
                              <tr style="border-top: 1px solid #e0e0e0;">
                                <td style="padding: 12px 0; color: #666; font-size: 15px;">Tipo de Envío:</td>
                                <td style="padding: 12px 0; text-align: right; color: #1a1a1a; font-size: 15px;">${formatTipoEnvio(orden.tipoEnvio)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Productos -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                        <tr>
                          <td style="padding: 25px;">
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
                              Productos
                            </h3>
                            ${orden.items
                              .map(
                                (item, index) => `
                              <table role="presentation" style="width: 100%; ${index < orden.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''} padding: 20px 0;">
                                <tr>
                                  <td style="vertical-align: top;">
                                    <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px; color: #1a1a1a;">${item.nombreProducto}</p>
                                    ${item.variante ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${item.variante}</p>` : ""}
                                    <p style="margin: 0; color: #999; font-size: 14px;">Cantidad: <strong style="color: #666;">${item.cantidad}</strong></p>
                                  </td>
                                  <td style="text-align: right; vertical-align: top; padding-left: 20px;">
                                    <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 18px; color: #ff6b35;">Q ${Number(item.subtotal).toFixed(2)}</p>
                                    <p style="margin: 0; color: #999; font-size: 13px;">Q ${Number(item.precioUnitario).toFixed(2)} c/u</p>
                                  </td>
                                </tr>
                              </table>
                            `
                              )
                              .join("")}
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Información de Envío -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
                              Información de Envío
                            </h3>
                            <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #333;">
                              <strong style="color: #1a1a1a;">Dirección:</strong><br>
                              <span style="color: #555;">${orden.direccionEnvio}</span>
                              ${orden.ciudadEnvio ? `<br><span style="color: #555;">${orden.ciudadEnvio}</span>` : ""}
                              ${orden.codigoPostalEnvio ? `<br><span style="color: #555;">Código Postal: ${orden.codigoPostalEnvio}</span>` : ""}
                            </p>
                            ${orden.nombreRecibe ? `<p style="margin: 12px 0; font-size: 15px; color: #333;"><strong style="color: #1a1a1a;">Persona que recibe:</strong> <span style="color: #555;">${orden.nombreRecibe}</span></p>` : ""}
                            ${orden.telefonoRecibe ? `<p style="margin: 12px 0; font-size: 15px; color: #333;"><strong style="color: #1a1a1a;">Teléfono de contacto:</strong> <span style="color: #555;">${orden.telefonoRecibe}</span></p>` : ""}
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Resumen de precios -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 2px solid #ff6b35; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 10px 0; color: #666; font-size: 15px;">Subtotal:</td>
                                <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 15px;">Q ${Number(orden.subtotal).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #666; font-size: 15px;">Envío:</td>
                                <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 15px;">Q ${Number(orden.envio).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #666; font-size: 15px;">Impuestos:</td>
                                <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 15px;">Q ${Number(orden.impuestos).toFixed(2)}</td>
                              </tr>
                              <tr style="border-top: 2px solid #ff6b35; margin-top: 10px;">
                                <td style="padding: 15px 0 5px 0; font-size: 20px; font-weight: bold; color: #1a1a1a;">Total:</td>
                                <td style="padding: 15px 0 5px 0; font-size: 24px; font-weight: bold; text-align: right; color: #ff6b35;">
                                  Q ${Number(orden.total).toFixed(2)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      ${orden.notas ? `
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-left: 4px solid #ff6b35; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <p style="margin: 0; font-size: 15px; color: #333;"><strong style="color: #1a1a1a;">Notas:</strong> <span style="color: #555;">${orden.notas}</span></p>
                          </td>
                        </tr>
                      </table>
                      ` : ""}
                      
                      <!-- Footer -->
                      <table role="presentation" style="width: 100%; border-top: 1px solid #e0e0e0; padding-top: 30px; margin-top: 30px;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px; line-height: 1.6;">
                              Si tienes alguna pregunta, no dudes en contactarnos.
                            </p>
                            ${logoUrl ? `
                              <img src="${logoUrl}" alt="TOPCELL" style="max-width: 150px; height: auto; display: block; margin: 0 auto 15px; opacity: 0.8;" />
                            ` : ""}
                            <p style="margin: 0; color: #999; font-size: 12px;">
                              © ${new Date().getFullYear()} TOPCELL TELECOMUNICACIONES. Todos los derechos reservados.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer inferior -->
                  <tr>
                    <td style="background: #ffffff; padding: 25px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "TopCell <noreply@topcellgt.com>",
      to: [orden.usuario.email],
      subject: `Confirmación de Orden - ${orden.numeroOrden}`,
      html,
    });

    if (error) {
      console.error("Error al enviar email de confirmación de orden:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error al enviar email de confirmación de orden:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía el email de confirmación de orden por ID.
 * Usado cuando el pago con tarjeta es aprobado (paso1, paso3 o paso5).
 */
export async function sendOrderConfirmationEmailForOrdenId(ordenId: number) {
  try {
    const ordenCompleta = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        usuario: true,
        items: {
          include: {
            telefonoNuevo: {
              include: {
                marca: true,
                imagenes: { orderBy: { orden: "asc" }, take: 1 },
              },
            },
            telefonoSeminuevo: {
              include: {
                marca: true,
                modelo: {
                  include: {
                    imagenes: { orderBy: { orden: "asc" }, take: 1 },
                  },
                },
              },
            },
            accesorio: {
              include: {
                marca: true,
                imagenes: { orderBy: { orden: "asc" }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!ordenCompleta) return { success: false, error: "Orden no encontrada" };

    const itemsParaEmail = ordenCompleta.items.map((item) => {
      let nombreProducto = "Producto";
      let variante = null;
      let imagenUrl = null;
      let detalles: any = null;
      if (item.detallesVariante) {
        try {
          detalles = JSON.parse(item.detallesVariante);
        } catch {}
      }
      if (item.tipoProducto === "TELEFONO_NUEVO" && item.telefonoNuevo) {
        nombreProducto = `${item.telefonoNuevo.marca.nombre} ${item.telefonoNuevo.modelo}`;
        if (detalles) {
          const partes = [];
          if (detalles.color) partes.push(detalles.color);
          if (detalles.rom) partes.push(detalles.rom);
          variante = partes.length > 0 ? partes.join(", ") : null;
        }
        imagenUrl = item.telefonoNuevo.imagenes[0]?.url || null;
      } else if (item.tipoProducto === "TELEFONO_SEMINUEVO" && item.telefonoSeminuevo) {
        nombreProducto = `${item.telefonoSeminuevo.marca.nombre} ${item.telefonoSeminuevo.modelo?.nombre || "Sin modelo"}`;
        if (detalles) {
          const partes = [];
          if (detalles.color) partes.push(detalles.color);
          if (detalles.rom) partes.push(detalles.rom);
          if (detalles.estado) partes.push(`Estado: ${detalles.estado}/10`);
          if (detalles.porcentajeBateria) partes.push(`Batería: ${detalles.porcentajeBateria}%`);
          variante = partes.length > 0 ? partes.join(", ") : null;
        }
        imagenUrl = item.telefonoSeminuevo.modelo?.imagenes[0]?.url || null;
      } else if (item.tipoProducto === "ACCESORIO" && item.accesorio) {
        nombreProducto = `${item.accesorio.marca.nombre} ${item.accesorio.modelo}`;
        if (detalles?.color) variante = detalles.color;
        imagenUrl = item.accesorio.imagenes[0]?.url || null;
      }
      return {
        id: item.id,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precioUnitario),
        subtotal: Number(item.subtotal),
        tipoProducto: item.tipoProducto,
        nombreProducto,
        variante,
        imagenUrl,
      };
    });

    const logoContent = await prisma.contenidoTienda.findFirst({
      where: { tipo: "logo", activo: true },
      orderBy: { orden: "asc" },
    });

    return await sendOrdenCreatedEmail(
      {
        id: ordenCompleta.id,
        numeroOrden: ordenCompleta.numeroOrden,
        estado: ordenCompleta.estado,
        subtotal: Number(ordenCompleta.subtotal),
        impuestos: Number(ordenCompleta.impuestos),
        envio: Number(ordenCompleta.envio),
        total: Number(ordenCompleta.total),
        tipoEnvio: ordenCompleta.tipoEnvio,
        metodoPago: ordenCompleta.metodoPago,
        direccionEnvio: ordenCompleta.direccionEnvio,
        ciudadEnvio: ordenCompleta.ciudadEnvio,
        codigoPostalEnvio: ordenCompleta.codigoPostalEnvio,
        nombreRecibe: ordenCompleta.nombreRecibe,
        telefonoRecibe: ordenCompleta.telefonoRecibe,
        notas: ordenCompleta.notas,
        createdAt: ordenCompleta.createdAt,
        usuario: {
          email: ordenCompleta.usuario.email,
          nombre: ordenCompleta.usuario.nombre,
          apellido: ordenCompleta.usuario.apellido,
          telefono: ordenCompleta.usuario.telefono,
        },
        items: itemsParaEmail,
      },
      logoContent?.url || null
    );
  } catch (error: any) {
    console.error("Error al enviar email de confirmación de orden (ordenId:", ordenId, "):", error);
    return { success: false, error: error.message };
  }
}

// Email cuando se actualiza una orden
export async function sendOrdenUpdatedEmail(orden: OrdenData, estadoAnterior?: string, logoUrl?: string | null) {
  try {
    const nombreCompleto = orden.usuario.apellido
      ? `${orden.usuario.nombre} ${orden.usuario.apellido}`
      : orden.usuario.nombre;

    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="TOPCELL" style="max-width: 200px; height: auto; display: block; margin: 0 auto 15px;" />`
      : `<h1 style="color: #1a1a1a; margin: 0 0 5px 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; text-align: center;">TOPCELL</h1><p style="color: #666; margin: 0; font-size: 14px; text-align: center; letter-spacing: 1px;">TELECOMUNICACIONES</p>`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Actualización de Orden - TOPCELL</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Header con logo -->
                  <tr>
                    <td style="background: #ffffff; padding: 50px 40px; text-align: center; border-bottom: 2px solid #ff6b35;">
                      ${logoHtml}
                      <h2 style="color: #1a1a1a; margin: 20px 0 0 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px;">Actualización de tu Orden</h2>
                    </td>
                  </tr>
                  
                  <!-- Contenido principal -->
                  <tr>
                    <td style="padding: 40px 40px 30px 40px;">
                      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #333;">
                        Hola <strong style="color: #ff6b35;">${nombreCompleto}</strong>,
                      </p>
                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555;">
                        Tu orden ha sido actualizada. Te informamos sobre los cambios:
                      </p>
                      
                      <!-- Número de Orden destacado -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 2px solid #ff6b35; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #ff6b35; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Número de Orden</p>
                            <p style="margin: 0; font-size: 28px; font-weight: bold; color: #000000; letter-spacing: 1px;">
                              ${orden.numeroOrden}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Estado de la Orden -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 12px;">
                              Estado de la Orden
                            </h3>
                            ${estadoAnterior && estadoAnterior !== orden.estado ? `
                              <table role="presentation" style="width: 100%; margin-bottom: 20px;">
                                <tr>
                                  <td style="padding: 8px 0; color: #666; font-size: 15px;"><strong>Estado anterior:</strong></td>
                                  <td style="padding: 8px 0; text-align: right; color: #666; font-size: 15px;">${formatEstado(estadoAnterior)}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #1a1a1a; font-size: 15px;"><strong>Estado actual:</strong></td>
                                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ff6b35; font-size: 16px;">${formatEstado(orden.estado)}</td>
                                </tr>
                              </table>
                            ` : `
                              <p style="margin: 0; font-size: 15px; color: #333;">
                                <strong style="color: #1a1a1a;">Estado actual:</strong> 
                                <span style="font-weight: bold; color: #ff6b35; font-size: 16px;">${formatEstado(orden.estado)}</span>
                              </p>
                            `}
                            
                            ${orden.estado === "ENVIADO" ? `
                              <table role="presentation" style="width: 100%; background: #e8f5e9; border-radius: 8px; padding: 20px; margin-top: 20px; border-left: 4px solid #4caf50;">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #2e7d32; font-size: 15px; line-height: 1.6;">
                                      <strong>¡Tu pedido ha sido enviado!</strong><br>
                                      Estamos preparando tu envío. Recibirás más información próximamente.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            ` : ""}
                            
                            ${orden.estado === "ENTREGADO" ? `
                              <table role="presentation" style="width: 100%; background: #e8f5e9; border-radius: 8px; padding: 20px; margin-top: 20px; border-left: 4px solid #4caf50;">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #2e7d32; font-size: 15px; line-height: 1.6;">
                                      <strong>¡Tu pedido ha sido entregado!</strong><br>
                                      Esperamos que estés satisfecho con tu compra. ¡Gracias por confiar en nosotros!
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            ` : ""}
                            
                            ${orden.estado === "PROCESANDO" ? `
                              <table role="presentation" style="width: 100%; background: #fff3e0; border-radius: 8px; padding: 20px; margin-top: 20px; border-left: 4px solid #ff9800;">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #e65100; font-size: 15px; line-height: 1.6;">
                                      <strong>Tu orden está siendo procesada</strong><br>
                                      Estamos preparando tu pedido. Te mantendremos informado sobre el progreso.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            ` : ""}
                            
                            ${orden.estado === "CANCELADO" ? `
                              <table role="presentation" style="width: 100%; background: #ffebee; border-radius: 8px; padding: 20px; margin-top: 20px; border-left: 4px solid #f44336;">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #c62828; font-size: 15px; line-height: 1.6;">
                                      <strong>Tu orden ha sido cancelada</strong><br>
                                      Si tienes alguna pregunta sobre esta cancelación, por favor contacta con nuestro equipo de atención al cliente.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            ` : ""}
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Resumen de la Orden -->
                      <table role="presentation" style="width: 100%; background: #ffffff; border: 2px solid #ff6b35; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid rgba(255,107,53,0.2); padding-bottom: 12px;">
                              Resumen de la Orden
                            </h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 10px 0; color: #666; font-size: 15px;">Subtotal:</td>
                                <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 15px;">Q ${Number(orden.subtotal).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #666; font-size: 15px;">Envío:</td>
                                <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 15px;">Q ${Number(orden.envio).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #666; font-size: 15px;">Impuestos:</td>
                                <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-size: 15px;">Q ${Number(orden.impuestos).toFixed(2)}</td>
                              </tr>
                              <tr style="border-top: 2px solid #ff6b35; margin-top: 10px;">
                                <td style="padding: 15px 0 5px 0; font-size: 20px; font-weight: bold; color: #1a1a1a;">Total:</td>
                                <td style="padding: 15px 0 5px 0; font-size: 24px; font-weight: bold; text-align: right; color: #ff6b35;">
                                  Q ${Number(orden.total).toFixed(2)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Footer -->
                      <table role="presentation" style="width: 100%; border-top: 1px solid #e0e0e0; padding-top: 30px; margin-top: 30px;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px; line-height: 1.6;">
                              Si tienes alguna pregunta, no dudes en contactarnos.
                            </p>
                            ${logoUrl ? `
                              <img src="${logoUrl}" alt="TOPCELL" style="max-width: 150px; height: auto; display: block; margin: 0 auto 15px; opacity: 0.8;" />
                            ` : ""}
                            <p style="margin: 0; color: #999; font-size: 12px;">
                              © ${new Date().getFullYear()} TOPCELL TELECOMUNICACIONES. Todos los derechos reservados.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer inferior -->
                  <tr>
                    <td style="background: #ffffff; padding: 25px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "TopCell <noreply@topcellgt.com>",
      to: [orden.usuario.email],
      subject: `Actualización de Orden - ${orden.numeroOrden}`,
      html,
    });

    if (error) {
      console.error("Error al enviar email de actualización de orden:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Error al enviar email de actualización de orden:", error);
    return { success: false, error: error.message };
  }
}
