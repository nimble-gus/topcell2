import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Listar usuarios con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const activo = searchParams.get("activo");

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { apellido: { contains: search } },
        { email: { contains: search } },
        { telefono: { contains: search } },
      ];
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === "true";
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      include: {
        _count: {
          select: {
            ordenes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(usuarios);
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

