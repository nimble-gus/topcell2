import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET: Listar usuarios admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Solo superadmin puede ver la lista de administradores
    const userRole = (session.user as any)?.role;
    if (userRole !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para ver esta información" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const activo = searchParams.get("activo");

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === "true";
    }

    const administradores = await prisma.usuarioAdmin.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        permisos: true,
        activo: true,
        createdAt: true,
        lastLogin: true,
        // No incluir passwordHash por seguridad
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(administradores);
  } catch (error: any) {
    console.error("Error al obtener administradores:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener administradores" },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo usuario admin
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Solo superadmin puede crear administradores
    const userRole = (session.user as any)?.role;
    if (userRole !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para crear administradores" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, nombre, password, rol, permisos, activo } = body;

    // Validaciones
    if (!email || !nombre || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: email, nombre, password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que el email no exista
    const existe = await prisma.usuarioAdmin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe un administrador con este email" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear administrador
    const administrador = await prisma.usuarioAdmin.create({
      data: {
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        passwordHash,
        rol: rol || "admin",
        permisos: permisos || null,
        activo: activo !== undefined ? activo : true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        permisos: true,
        activo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(administrador, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear administrador:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear administrador" },
      { status: 500 }
    );
  }
}

