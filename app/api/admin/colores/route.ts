import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const colores = await prisma.color.findMany({
      orderBy: {
        color: "asc",
      },
    });

    return NextResponse.json(colores);
  } catch (error: any) {
    console.error("Error al obtener colores:", error);
    return NextResponse.json(
      { error: "Error al obtener colores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { color } = body;

    if (!color || color.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del color es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el color ya existe
    const colorExistente = await prisma.color.findUnique({
      where: { color: color.trim() },
    });

    if (colorExistente) {
      return NextResponse.json(
        { error: "Este color ya existe" },
        { status: 400 }
      );
    }

    const nuevoColor = await prisma.color.create({
      data: {
        color: color.trim(),
      },
    });

    return NextResponse.json(nuevoColor, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear color:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear color" },
      { status: 500 }
    );
  }
}

