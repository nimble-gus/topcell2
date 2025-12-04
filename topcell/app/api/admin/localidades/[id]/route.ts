import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const localidad = await prisma.localidad.findUnique({
      where: { id },
    });

    if (!localidad) {
      return NextResponse.json(
        { error: "Localidad no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(localidad);
  } catch (error: any) {
    console.error("Error al obtener localidad:", error);
    return NextResponse.json(
      { error: "Error al obtener localidad" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      imagenUrl,
      titulo,
      direccion,
      telefono,
      linkGoogleMaps,
      linkWaze,
      activo,
      orden,
    } = body;

    // Validar campos requeridos
    if (!imagenUrl || !titulo || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: imagen, título y dirección" },
        { status: 400 }
      );
    }

    const localidad = await prisma.localidad.update({
      where: { id },
      data: {
        imagenUrl,
        titulo: titulo.trim(),
        direccion: direccion.trim(),
        telefono: telefono?.trim() || null,
        linkGoogleMaps: linkGoogleMaps?.trim() || null,
        linkWaze: linkWaze?.trim() || null,
        activo: activo !== undefined ? activo : true,
        orden: orden !== undefined ? orden : 0,
      },
    });

    return NextResponse.json(localidad);
  } catch (error: any) {
    console.error("Error al actualizar localidad:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar localidad" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    await prisma.localidad.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Localidad eliminada correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar localidad:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar localidad" },
      { status: 500 }
    );
  }
}

