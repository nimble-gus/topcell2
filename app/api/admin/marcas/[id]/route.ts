import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener una marca específica
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

    const marca = await prisma.marca.findUnique({
      where: { id },
    });

    if (!marca) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(marca);
  } catch (error: any) {
    console.error("Error al obtener marca:", error);
    return NextResponse.json(
      { error: "Error al obtener marca" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una marca
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

    // Verificar que la marca existe
    const marcaExistente = await prisma.marca.findUnique({
      where: { id },
    });

    if (!marcaExistente) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nombre, logoUrl } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la marca es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el nombre ya existe en otra marca
    const marcaConMismoNombre = await prisma.marca.findFirst({
      where: {
        nombre: nombre.trim(),
        id: { not: id },
      },
    });

    if (marcaConMismoNombre) {
      return NextResponse.json(
        { error: "Ya existe una marca con ese nombre" },
        { status: 400 }
      );
    }

    // Actualizar la marca
    const marca = await prisma.marca.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json(marca);
  } catch (error: any) {
    console.error("Error al actualizar marca:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar marca" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una marca
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

    // Verificar que la marca existe
    const marca = await prisma.marca.findUnique({
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

    if (!marca) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si hay productos asociados
    const totalProductos =
      marca._count.telefonosNuevos +
      marca._count.telefonosSeminuevos +
      marca._count.accesorios;

    if (totalProductos > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la marca porque tiene ${totalProductos} producto(s) asociado(s). Elimina o mueve los productos primero.`,
        },
        { status: 400 }
      );
    }

    // Eliminar la marca
    await prisma.marca.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Marca eliminada correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar marca:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar marca" },
      { status: 500 }
    );
  }
}

