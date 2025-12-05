import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const usuarioId = parseInt(id);

    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        ordenes: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Últimas 10 órdenes
          include: {
            items: {
              take: 3, // Primeros 3 items
            },
          },
        },
        _count: {
          select: {
            ordenes: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const usuarioId = parseInt(id);

    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombre, apellido, telefono, direccion, ciudad, codigoPostal, activo } = body;

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: nombre?.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        ciudad: ciudad?.trim() || null,
        codigoPostal: codigoPostal?.trim() || null,
        activo: activo !== undefined ? activo : true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

