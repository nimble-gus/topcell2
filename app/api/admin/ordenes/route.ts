import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Listar todas las órdenes con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");
    const cliente = searchParams.get("cliente"); // Búsqueda por nombre o email

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta);
        fechaHastaDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = fechaHastaDate;
      }
    }

    if (cliente) {
      // Normalizar el término de búsqueda para búsqueda case-insensitive
      const clienteLower = cliente.toLowerCase();
      where.usuario = {
        OR: [
          { nombre: { contains: cliente } },
          { email: { contains: cliente } },
        ],
      };
    }

    const ordenes = await prisma.orden.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        items: {
          include: {
            telefonoNuevo: {
              select: {
                id: true,
                modelo: true,
                marca: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
            telefonoSeminuevo: {
              select: {
                id: true,
                modelo: true,
                marca: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
            accesorio: {
              select: {
                id: true,
                modelo: true,
                marca: {
                  select: {
                    nombre: true,
                  },
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
      { error: error.message || "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}

