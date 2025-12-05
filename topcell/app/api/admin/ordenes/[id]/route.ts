import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Obtener detalles de una orden específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ordenId = parseInt(id);

    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: "ID de orden inválido" },
        { status: 400 }
      );
    }

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        usuario: true,
        items: {
          include: {
            telefonoNuevo: {
              include: {
                marca: true,
                imagenes: {
                  orderBy: { orden: "asc" },
                  take: 1,
                },
              },
            },
            telefonoSeminuevo: {
              include: {
                marca: true,
                imagenes: {
                  orderBy: { orden: "asc" },
                  take: 1,
                },
              },
            },
            accesorio: {
              include: {
                marca: true,
                imagenes: {
                  orderBy: { orden: "asc" },
                  take: 1,
                },
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

    return NextResponse.json(orden);
  } catch (error: any) {
    console.error("Error al obtener orden:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener la orden" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar estado de una orden
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ordenId = parseInt(id);

    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: "ID de orden inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { estado } = body;

    if (!estado || !["PENDIENTE", "PROCESANDO", "ENVIADO", "ENTREGADO", "CANCELADO"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Verificar que la orden existe
    const ordenExistente = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        items: true,
      },
    });

    if (!ordenExistente) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Si se está cancelando, restaurar stock
    if (estado === "CANCELADO" && ordenExistente.estado !== "CANCELADO") {
      await prisma.$transaction(async (tx) => {
        // Actualizar estado
        await tx.orden.update({
          where: { id: ordenId },
          data: { estado: "CANCELADO" },
        });

        // Restaurar stock para cada item
        // Nota: Como ItemOrden no guarda varianteId/colorId, intentamos encontrar
        // la variante/color que coincida con el precio unitario
        for (const item of ordenExistente.items) {
          if (item.tipoProducto === "TELEFONO_NUEVO" && item.telefonoNuevoId) {
            const telefono = await tx.telefonoNuevo.findUnique({
              where: { id: item.telefonoNuevoId },
              include: { variantes: true },
            });
            if (telefono && telefono.variantes.length > 0) {
              // Buscar variante que coincida con el precio unitario
              const variante = telefono.variantes.find(
                (v) => Number(v.precio) === Number(item.precioUnitario)
              ) || telefono.variantes[0]; // Si no encuentra, usar la primera
              
              await tx.telefonoNuevoVariante.update({
                where: { id: variante.id },
                data: {
                  stock: {
                    increment: item.cantidad,
                  },
                },
              });
            }
          } else if (item.tipoProducto === "TELEFONO_SEMINUEVO" && item.telefonoSeminuevoId) {
            const telefono = await tx.telefonoSeminuevo.findUnique({
              where: { id: item.telefonoSeminuevoId },
              include: { variantes: true },
            });
            if (telefono && telefono.variantes.length > 0) {
              // Buscar variante que coincida con el precio unitario
              const variante = telefono.variantes.find(
                (v) => Number(v.precio) === Number(item.precioUnitario)
              ) || telefono.variantes[0];
              
              await tx.telefonoSeminuevoVariante.update({
                where: { id: variante.id },
                data: {
                  stock: {
                    increment: item.cantidad,
                  },
                },
              });
            }
          } else if (item.tipoProducto === "ACCESORIO" && item.accesorioId) {
            const accesorio = await tx.accesorio.findUnique({
              where: { id: item.accesorioId },
              include: { colores: true },
            });
            if (accesorio && accesorio.colores.length > 0) {
              // Para accesorios, el precio es del producto principal
              // Restauramos stock del primer color disponible
              // (Idealmente deberíamos guardar el colorId en ItemOrden)
              await tx.accesorioColor.update({
                where: { id: accesorio.colores[0].id },
                data: {
                  stock: {
                    increment: item.cantidad,
                  },
                },
              });
            }
          }
        }
      });
    } else {
      // Solo actualizar estado
      await prisma.orden.update({
        where: { id: ordenId },
        data: { estado },
      });
    }

    const ordenActualizada = await prisma.orden.findUnique({
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

    return NextResponse.json(ordenActualizada);
  } catch (error: any) {
    console.error("Error al actualizar orden:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la orden" },
      { status: 500 }
    );
  }
}

