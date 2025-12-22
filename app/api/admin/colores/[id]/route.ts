import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener un color específico
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

    const color = await prisma.color.findUnique({
      where: { id },
    });

    if (!color) {
      return NextResponse.json(
        { error: "Color no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(color);
  } catch (error: any) {
    console.error("Error al obtener color:", error);
    return NextResponse.json(
      { error: "Error al obtener color" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un color
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

    // Verificar que el color existe
    const colorExistente = await prisma.color.findUnique({
      where: { id },
    });

    if (!colorExistente) {
      return NextResponse.json(
        { error: "Color no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { color: nombreColor } = body;

    if (!nombreColor || nombreColor.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del color es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el nombre ya existe en otro color
    const colorConMismoNombre = await prisma.color.findFirst({
      where: {
        color: nombreColor.trim(),
        id: { not: id },
      },
    });

    if (colorConMismoNombre) {
      return NextResponse.json(
        { error: "Ya existe un color con ese nombre" },
        { status: 400 }
      );
    }

    // Actualizar el color
    const color = await prisma.color.update({
      where: { id },
      data: {
        color: nombreColor.trim(),
      },
    });

    return NextResponse.json(color);
  } catch (error: any) {
    console.error("Error al actualizar color:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar color" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un color
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

    // Verificar que el color existe
    const color = await prisma.color.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            telefonosNuevos: true,
            telefonosSeminuevos: true,
            accesorios: true,
          },
        },
      },
    });

    if (!color) {
      return NextResponse.json(
        { error: "Color no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay productos asociados
    const totalProductos =
      color._count.telefonosNuevos +
      color._count.telefonosSeminuevos +
      color._count.accesorios;

    if (totalProductos > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el color porque está siendo usado en ${totalProductos} variante(s) de producto(s). Elimina o modifica los productos primero.`,
        },
        { status: 400 }
      );
    }

    // Eliminar el color
    await prisma.color.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Color eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar color:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar color" },
      { status: 500 }
    );
  }
}

