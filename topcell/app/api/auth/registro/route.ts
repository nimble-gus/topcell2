import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nombre, apellido, telefono, password } = body;

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
    const existe = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existe) {
      // Si el usuario existe pero no tiene contraseña, actualizar
      if (!existe.passwordHash) {
        const passwordHash = await bcrypt.hash(password, 10);
        const usuario = await prisma.usuario.update({
          where: { id: existe.id },
          data: {
            nombre: nombre.trim(),
            apellido: apellido?.trim() || null,
            telefono: telefono?.trim() || null,
            passwordHash,
          },
        });

        return NextResponse.json(
          {
            message: "Cuenta creada exitosamente. Ya tenías una cuenta con este email, ahora puedes iniciar sesión.",
            usuario: {
              id: usuario.id,
              email: usuario.email,
              nombre: usuario.nombre,
            },
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente",
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar usuario" },
      { status: 500 }
    );
  }
}

