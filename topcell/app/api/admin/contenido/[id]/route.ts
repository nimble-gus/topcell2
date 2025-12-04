import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener un contenido específico
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

    const contenido = await prisma.contenidoTienda.findUnique({
      where: { id },
    });

    if (!contenido) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(contenido);
  } catch (error: any) {
    console.error("Error al obtener contenido:", error);
    return NextResponse.json(
      { error: "Error al obtener contenido" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar contenido
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

    const contenidoExistente = await prisma.contenidoTienda.findUnique({
      where: { id },
    });

    if (!contenidoExistente) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { url, urlDestino, titulo, descripcion, activo, orden } = body;

    // Si se está activando un logo, desactivar otros logos
    if (contenidoExistente.tipo === "logo" && activo === true) {
      await prisma.contenidoTienda.updateMany({
        where: {
          tipo: "logo",
          NOT: { id },
        },
        data: { activo: false },
      });
    }

    const contenido = await prisma.contenidoTienda.update({
      where: { id },
      data: {
        url: url !== undefined ? url : contenidoExistente.url,
        urlDestino: urlDestino !== undefined ? urlDestino : contenidoExistente.urlDestino,
        titulo: titulo !== undefined ? titulo : contenidoExistente.titulo,
        descripcion: descripcion !== undefined ? descripcion : contenidoExistente.descripcion,
        activo: activo !== undefined ? activo : contenidoExistente.activo,
        orden: orden !== undefined ? orden : contenidoExistente.orden,
      },
    });

    return NextResponse.json(contenido);
  } catch (error: any) {
    console.error("Error al actualizar contenido:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar contenido" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar contenido
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

    await prisma.contenidoTienda.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Contenido eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar contenido:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar contenido" },
      { status: 500 }
    );
  }
}

