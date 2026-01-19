import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
                modelo: {
                  include: {
                    imagenes: {
                      orderBy: { orden: "asc" },
                      take: 1,
                    },
                  },
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

