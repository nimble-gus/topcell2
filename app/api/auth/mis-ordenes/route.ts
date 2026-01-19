import { NextRequest, NextResponse } from "next/server";
import { storeAuth } from "@/lib/auth-store";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await storeAuth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que es un usuario de la tienda (no admin)
    if ((session.user as any)?.type !== "user") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id);

    const ordenes = await prisma.orden.findMany({
      where: { usuarioId: userId },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(ordenes);
  } catch (error: any) {
    console.error("Error al obtener órdenes:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener órdenes" },
      { status: 500 }
    );
  }
}

