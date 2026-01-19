import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marca: string; modelo: string }> }
) {
  try {
    const { marca: marcaSlug, modelo: modeloSlug } = await params;
    
    // Decodificar los slugs (pueden venir con espacios como guiones)
    const marcaNombreRaw = decodeURIComponent(marcaSlug).replace(/-/g, " ");
    const modeloNombreRaw = decodeURIComponent(modeloSlug).replace(/-/g, " ");
    
    // Normalizar: primera letra mayúscula, resto minúsculas
    const marcaNombre = marcaNombreRaw.charAt(0).toUpperCase() + marcaNombreRaw.slice(1).toLowerCase();
    const modeloNombre = modeloNombreRaw.charAt(0).toUpperCase() + modeloNombreRaw.slice(1).toLowerCase();

    const telefono = await prisma.telefonoSeminuevo.findFirst({
      where: {
        activo: true,
        marca: {
          nombre: {
            equals: marcaNombre,
          },
        },
      modelo: {
        nombre: {
          equals: modeloNombre,
        },
      },
      },
      include: {
        marca: true,
        modelo: {
          include: {
            imagenes: {
              orderBy: { orden: "asc" },
            },
          },
        },
        variantes: {
          where: {
            stock: { gt: 0 }, // Solo variantes con stock
          },
          include: {
            color: true,
            imagenes: {
              orderBy: { orden: "asc" },
            },
          },
          orderBy: [
            { precio: "asc" },
            { estado: "desc" },
          ],
        },
      },
    });

    if (!telefono) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(telefono);
  } catch (error: any) {
    console.error("Error al obtener teléfono seminuevo:", error);
    return NextResponse.json(
      { error: "Error al obtener teléfono seminuevo" },
      { status: 500 }
    );
  }
}
