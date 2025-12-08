import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const marcas = await prisma.marca.findMany({
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(marcas);
  } catch (error: any) {
    console.error("Error al obtener marcas:", error);
    return NextResponse.json(
      { error: "Error al obtener marcas" },
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
    const { nombre, logoUrl } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la marca es requerido" },
        { status: 400 }
      );
    }

    // Verificar si la marca ya existe
    const marcaExistente = await prisma.marca.findUnique({
      where: { nombre: nombre.trim() },
    });

    if (marcaExistente) {
      return NextResponse.json(
        { error: "Esta marca ya existe" },
        { status: 400 }
      );
    }

    const marca = await prisma.marca.create({
      data: {
        nombre: nombre.trim(),
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json(marca, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear marca:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear marca" },
      { status: 500 }
    );
  }
}

