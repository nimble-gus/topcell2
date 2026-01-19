import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const modelos = await prisma.modelo.findMany({
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
      orderBy: [
        { marca: { nombre: "asc" } },
        { nombre: "asc" },
      ],
    });

    return NextResponse.json(modelos);
  } catch (error: any) {
    console.error("Error al obtener modelos:", error);
    return NextResponse.json(
      { error: "Error al obtener modelos" },
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
    const { marcaId, nombre, imagenes } = body;

    if (!marcaId || !nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "La marca y el nombre del modelo son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el modelo ya existe para esta marca
    const modeloExistente = await prisma.modelo.findUnique({
      where: {
        marcaId_nombre: {
          marcaId: parseInt(marcaId),
          nombre: nombre.trim(),
        },
      },
    });

    if (modeloExistente) {
      return NextResponse.json(
        { error: "Este modelo ya existe para esta marca" },
        { status: 400 }
      );
    }

    const modelo = await prisma.modelo.create({
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

    return NextResponse.json(modelo, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear modelo:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear modelo" },
      { status: 500 }
    );
  }
}
