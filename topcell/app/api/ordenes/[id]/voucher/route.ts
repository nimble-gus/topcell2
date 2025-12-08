import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarVoucherPDF } from "@/lib/voucher";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ordenId = parseInt(id);

    // Obtener la orden con todos los datos necesarios
    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        usuario: true,
        items: {
          include: {
            telefonoNuevo: {
              include: {
                marca: true,
              },
            },
            telefonoSeminuevo: {
              include: {
                marca: true,
              },
            },
            accesorio: {
              include: {
                marca: true,
              },
            },
          },
        },
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Determinar si es anulación
    const esAnulacion = orden.estadoPago === "ANULADO";

    // Preparar items para el voucher
    const items = orden.items.map((item) => {
      let nombre = "";
      
      if (item.tipoProducto === "TELEFONO_NUEVO" && item.telefonoNuevo) {
        nombre = `${item.telefonoNuevo.marca.nombre} ${item.telefonoNuevo.modelo}`;
      } else if (item.tipoProducto === "TELEFONO_SEMINUEVO" && item.telefonoSeminuevo) {
        nombre = `${item.telefonoSeminuevo.marca.nombre} ${item.telefonoSeminuevo.modelo}`;
      } else if (item.tipoProducto === "ACCESORIO" && item.accesorio) {
        nombre = `${item.accesorio.marca.nombre} ${item.accesorio.modelo}`;
      } else {
        nombre = "Producto";
      }

      return {
        nombre,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precioUnitario),
        subtotal: Number(item.subtotal),
      };
    });

    // Preparar datos para el voucher
    const voucherData = {
      numeroOrden: orden.numeroOrden,
      fechaOrden: orden.createdAt,
      estado: orden.estado,
      subtotal: Number(orden.subtotal),
      envio: Number(orden.envio),
      total: Number(orden.total),
      nombreCliente: orden.usuario.nombre,
      emailCliente: orden.usuario.email,
      telefonoCliente: orden.usuario.telefono,
      direccionEnvio: orden.direccionEnvio,
      ciudadEnvio: orden.ciudadEnvio,
      metodoPago: orden.metodoPago,
      estadoPago: orden.estadoPago,
      numeroTarjeta: orden.numeroTarjeta,
      tipoTarjeta: orden.tipoTarjeta,
      retrievalRefNo: orden.retrievalRefNo,
      authIdResponse: orden.authIdResponse,
      fechaTransaccion: orden.fechaTransaccion,
      timeLocalTrans: orden.timeLocalTrans,
      dateLocalTrans: orden.dateLocalTrans,
      typeOperation: orden.typeOperation,
      items,
      esAnulacion,
    };

    // Generar PDF
    const pdfBuffer = await generarVoucherPDF(voucherData);

    // Retornar PDF como respuesta
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="voucher-${orden.numeroOrden}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error al generar voucher:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el voucher" },
      { status: 500 }
    );
  }
}

