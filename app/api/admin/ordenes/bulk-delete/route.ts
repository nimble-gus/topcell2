import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Eliminar varias órdenes. Si alguna no estaba cancelada, se restaura su stock.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.map((x: unknown) => Number(x)).filter((n: number) => !isNaN(n)) : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Debe enviar un array 'ids' con al menos un ID de orden" },
        { status: 400 }
      );
    }

    const ordenes = await prisma.orden.findMany({
      where: { id: { in: ids } },
      include: { items: true },
    });

    for (const orden of ordenes) {
      if (orden.estado !== "CANCELADO") {
        await prisma.$transaction(async (tx) => {
          for (const item of orden.items) {
            if (item.tipoProducto === "TELEFONO_NUEVO" && item.telefonoNuevoId) {
              const telefono = await tx.telefonoNuevo.findUnique({
                where: { id: item.telefonoNuevoId },
                include: { variantes: true },
              });
              if (telefono && telefono.variantes.length > 0) {
                const variante = telefono.variantes.find(
                  (v) => Number(v.precio) === Number(item.precioUnitario)
                ) || telefono.variantes[0];
                await tx.telefonoNuevoVariante.update({
                  where: { id: variante.id },
                  data: { stock: { increment: item.cantidad } },
                });
              }
            } else if (item.tipoProducto === "TELEFONO_SEMINUEVO" && item.telefonoSeminuevoId) {
              const telefono = await tx.telefonoSeminuevo.findUnique({
                where: { id: item.telefonoSeminuevoId },
                include: { variantes: true },
              });
              if (telefono && telefono.variantes.length > 0) {
                const variante = telefono.variantes.find(
                  (v) => Number(v.precio) === Number(item.precioUnitario)
                ) || telefono.variantes[0];
                await tx.telefonoSeminuevoVariante.update({
                  where: { id: variante.id },
                  data: { stock: { increment: item.cantidad } },
                });
              }
            } else if (item.tipoProducto === "ACCESORIO" && item.accesorioId) {
              const accesorio = await tx.accesorio.findUnique({
                where: { id: item.accesorioId },
                include: { colores: true },
              });
              if (accesorio && accesorio.colores.length > 0) {
                await tx.accesorioColor.update({
                  where: { id: accesorio.colores[0].id },
                  data: { stock: { increment: item.cantidad } },
                });
              }
            }
          }
        });
      }
    }

    await prisma.orden.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error("Error al eliminar órdenes:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar las órdenes" },
      { status: 500 }
    );
  }
}
