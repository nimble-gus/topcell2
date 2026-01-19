import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener un modelo específico
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

    const modelo = await prisma.modelo.findUnique({
      where: { id },
      include: {
        marca: true,
        imagenes: {
          orderBy: { orden: "asc" },
        },
        _count: {
          select: {
            telefonosSeminuevos: true,
          },
        },
      },
    });

    if (!modelo) {
      return NextResponse.json(
        { error: "Modelo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(modelo);
  } catch (error: any) {
    console.error("Error al obtener modelo:", error);
    return NextResponse.json(
      { error: "Error al obtener modelo" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un modelo
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
    const { marcaId, nombre, imagenes } = body;

    if (!marcaId || !nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "La marca y el nombre del modelo son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si existe otro modelo con el mismo nombre para esta marca
    const modeloExistente = await prisma.modelo.findUnique({
      where: {
        marcaId_nombre: {
          marcaId: parseInt(marcaId),
          nombre: nombre.trim(),
        },
      },
    });

    if (modeloExistente && modeloExistente.id !== id) {
      return NextResponse.json(
        { error: "Este modelo ya existe para esta marca" },
        { status: 400 }
      );
    }

    // Actualizar usando transacción
    const modelo = await prisma.$transaction(async (tx) => {
      // Eliminar imágenes existentes
      await tx.imagenProducto.deleteMany({
        where: { modeloId: id },
      });

      // Actualizar modelo
      return await tx.modelo.update({
        where: { id },
        data: {
          marcaId: parseInt(marcaId),
          nombre: nombre.trim(),
          imagenes: {
            create: (imagenes || []).map((url: string, index: number) => ({
              url,
              tipo: index === 0 ? "principal" : "galeria",
              orden: index,
            })),
          },
        },
        include: {
          marca: true,
          imagenes: {
            orderBy: { orden: "asc" },
          },
        },
      });
    });

    return NextResponse.json(modelo);
  } catch (error: any) {
    console.error("Error al actualizar modelo:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar modelo" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un modelo
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

    const modelo = await prisma.modelo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            telefonosSeminuevos: true,
          },
        },
      },
    });

    if (!modelo) {
      return NextResponse.json(
        { error: "Modelo no encontrado" },
        { status: 404 }
      );
    }

    if (modelo._count.telefonosSeminuevos > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el modelo porque está siendo usado en ${modelo._count.telefonosSeminuevos} teléfono(s) seminuevo(s). Elimina o modifica los teléfonos primero.`,
        },
        { status: 400 }
      );
    }

    await prisma.modelo.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Modelo eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar modelo:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar modelo" },
      { status: 500 }
    );
  }
}
