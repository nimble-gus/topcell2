import { NextRequest, NextResponse } from "next/server";
import { storeAuth } from "@/lib/auth-store";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET: Obtener perfil del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await storeAuth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que es un usuario de la tienda (no admin)
    if ((session.user as any)?.type !== "user") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id);
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        codigoPostal: true,
        createdAt: true,
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
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar perfil del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await storeAuth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que es un usuario de la tienda (no admin)
    if ((session.user as any)?.type !== "user") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id);
    const body = await request.json();
    const { nombre, apellido, telefono, direccion, ciudad, codigoPostal, password } = body;

    const updateData: any = {};

    if (nombre !== undefined) {
      updateData.nombre = nombre.trim();
    }
    if (apellido !== undefined) {
      updateData.apellido = apellido?.trim() || null;
    }
    if (telefono !== undefined) {
      updateData.telefono = telefono?.trim() || null;
    }
    if (direccion !== undefined) {
      updateData.direccion = direccion?.trim() || null;
    }
    if (ciudad !== undefined) {
      updateData.ciudad = ciudad?.trim() || null;
    }
    if (codigoPostal !== undefined) {
      updateData.codigoPostal = codigoPostal?.trim() || null;
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

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        codigoPostal: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}

