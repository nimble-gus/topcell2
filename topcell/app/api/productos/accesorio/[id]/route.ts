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

    const accesorio = await prisma.accesorio.findUnique({
      where: { 
        id,
        activo: true,
      },
      include: {
        marca: true,
        colores: {
          include: {
            color: true,
          },
        },
        imagenes: {
          orderBy: { orden: "asc" },
        },
      },
    });

    if (!accesorio) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(accesorio);
  } catch (error: any) {
    console.error("Error al obtener accesorio:", error);
    return NextResponse.json(
      { error: "Error al obtener accesorio" },
      { status: 500 }
    );
  }
}

