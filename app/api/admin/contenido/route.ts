import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener contenido (con filtro opcional por tipo)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }

    const contenido = await prisma.contenidoTienda.findMany({
      where,
      orderBy: [
        { tipo: "asc" },
        { orden: "asc" },
      ],
    });

    return NextResponse.json(contenido);
  } catch (error: any) {
    console.error("Error al obtener contenido:", error);
    return NextResponse.json(
      { error: "Error al obtener contenido" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo contenido
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, url, urlDestino, titulo, descripcion, activo, orden } = body;

    // Tipos de contenido solo texto (conocenos, privacidad, terminos) no requieren URL
    const tiposSoloContenido = ["conocenos-contenido", "privacidad-contenido", "terminos-contenido"];
    const requiereUrl = !tiposSoloContenido.includes(tipo);

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo es requerido" },
        { status: 400 }
      );
    }
    if (requiereUrl && !url) {
      return NextResponse.json(
        { error: "Tipo y URL son requeridos" },
        { status: 400 }
      );
    }

    // Para tipos solo contenido, usar placeholder ya que el schema exige url no vacía
    const urlFinal = url?.trim() || (tiposSoloContenido.includes(tipo) ? " " : "");

    // Si es logo, desactivar otros logos
    if (tipo === "logo") {
      await prisma.contenidoTienda.updateMany({
        where: { tipo: "logo" },
        data: { activo: false },
      });
    }

    const contenido = await prisma.contenidoTienda.create({
      data: {
        tipo,
        url: urlFinal || " ",
        urlDestino: urlDestino || null,
        titulo: titulo || null,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true,
        orden: orden || 0,
      },
    });

    return NextResponse.json(contenido, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear contenido:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear contenido" },
      { status: 500 }
    );
  }
}

