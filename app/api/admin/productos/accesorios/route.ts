import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccesorioStock } from "@/lib/product-utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const accesorios = await prisma.accesorio.findMany({
      where: { activo: true },
      include: {
        marca: true,
        colores: {
          include: {
            color: true,
          },
        },
        imagenes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(accesorios);
  } catch (error: any) {
    console.error("Error al obtener accesorios:", error);
    return NextResponse.json(
      { error: "Error al obtener accesorios" },
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
    console.log("📥 Datos recibidos:", JSON.stringify(body, null, 2));

    const {
      marcaId,
      modelo,
      precio,
      descripcion,
      featured,
      colores, // Array de { colorId, stock }
      imagenes,
    } = body;

    // Validar campos requeridos
    const camposFaltantes: string[] = [];
    if (!marcaId) camposFaltantes.push("Marca");
    if (!modelo || modelo.trim() === "") camposFaltantes.push("Modelo");
    if (!precio || precio === "") camposFaltantes.push("Precio");
    if (!descripcion || descripcion.trim() === "") camposFaltantes.push("Descripción");

    if (camposFaltantes.length > 0) {
      return NextResponse.json(
        {
          error: `Faltan campos requeridos: ${camposFaltantes.join(", ")}`,
          camposFaltantes,
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos un color con stock
    if (!colores || !Array.isArray(colores) || colores.length === 0) {
      return NextResponse.json(
        { error: "Debe seleccionar al menos un color con stock" },
        { status: 400 }
      );
    }

    // Validar que cada color tenga stock
    const coloresInvalidos: string[] = [];
    colores.forEach((c: any, index: number) => {
      if (!c.colorId) coloresInvalidos.push(`Color ${index + 1}: falta el color`);
      if (c.stock === undefined || c.stock === null || c.stock === "" || c.stock < 0) {
        coloresInvalidos.push(`Color ${index + 1}: falta el stock o es inválido`);
      }
    });

    if (coloresInvalidos.length > 0) {
      return NextResponse.json(
        {
          error: `Colores incompletos: ${coloresInvalidos.join(", ")}`,
          coloresInvalidos,
        },
        { status: 400 }
      );
    }

    // Crear el accesorio con colores e imágenes
    const accesorio = await prisma.accesorio.create({
      data: {
        marcaId: parseInt(marcaId),
        modelo: modelo.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim(),
        featured: featured === true || featured === "true",
        stock: 0, // Se calculará después desde los colores
        colores: {
          create: colores.map((c: any) => ({
            colorId: parseInt(c.colorId),
            stock: parseInt(c.stock || 0),
            imagenes: {
              create: (c.imagenes || []).map((url: string, imgIndex: number) => ({
                url,
                tipo: imgIndex === 0 ? "principal" : "galeria",
                orden: imgIndex,
              })),
            },
          })),
        },
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
        colores: {
          include: {
            color: true,
            imagenes: {
              orderBy: { orden: "asc" },
            },
          },
        },
        imagenes: true,
      },
    });

    // Recalcular y actualizar el stock total
    await updateAccesorioStock(accesorio.id);

    return NextResponse.json(accesorio, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear accesorio:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear accesorio" },
      { status: 500 }
    );
  }
}

