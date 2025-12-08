import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET: Obtener un administrador específico
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

    // Solo superadmin puede ver administradores
    const userRole = (session.user as any)?.role;
    if (userRole !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para ver esta información" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: "ID de administrador inválido" },
        { status: 400 }
      );
    }

    const administrador = await prisma.usuarioAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        permisos: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!administrador) {
      return NextResponse.json(
        { error: "Administrador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(administrador);
  } catch (error: any) {
    console.error("Error al obtener administrador:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener administrador" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar administrador
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

    // Solo superadmin puede actualizar administradores
    const userRole = (session.user as any)?.role;
    if (userRole !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar administradores" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: "ID de administrador inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombre, password, rol, permisos, activo } = body;

    // Verificar que el administrador existe
    const existe = await prisma.usuarioAdmin.findUnique({
      where: { id: adminId },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Administrador no encontrado" },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (nombre !== undefined) {
      updateData.nombre = nombre.trim();
    }

    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (rol !== undefined) {
      updateData.rol = rol;
    }

    if (permisos !== undefined) {
      updateData.permisos = permisos;
    }

    if (activo !== undefined) {
      updateData.activo = activo;
    }

    const administrador = await prisma.usuarioAdmin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        permisos: true,
        activo: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(administrador);
  } catch (error: any) {
    console.error("Error al actualizar administrador:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar administrador" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar (desactivar) administrador
export async function DELETE(
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

    // Solo superadmin puede eliminar administradores
    const userRole = (session.user as any)?.role;
    if (userRole !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar administradores" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: "ID de administrador inválido" },
        { status: 400 }
      );
    }

    // No permitir auto-eliminación
    const currentUserId = parseInt((session.user as any).id);
    if (adminId === currentUserId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    // Soft delete: solo desactivar
    const administrador = await prisma.usuarioAdmin.update({
      where: { id: adminId },
      data: { activo: false },
      select: {
        id: true,
        email: true,
        nombre: true,
        activo: true,
      },
    });

    return NextResponse.json(administrador);
  } catch (error: any) {
    console.error("Error al eliminar administrador:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar administrador" },
      { status: 500 }
    );
  }
}

