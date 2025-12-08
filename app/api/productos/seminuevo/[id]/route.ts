import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const telefono = await prisma.telefonoSeminuevo.findUnique({
      where: { 
        id,
        activo: true,
      },
      include: {
        marca: true,
        variantes: {
          include: {
            color: true,
          },
          orderBy: [
            { precio: "asc" },
            { estado: "desc" },
          ],
        },
        imagenes: {
          orderBy: { orden: "asc" },
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

