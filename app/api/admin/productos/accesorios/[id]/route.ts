import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccesorioStock } from "@/lib/product-utils";

// GET - Obtener un accesorio específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const accesorio = await prisma.accesorio.findUnique({
      where: { id },
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

    if (!accesorio) {
      return NextResponse.json(
        { error: "Accesorio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(accesorio);
  } catch (error: any) {
    console.error("Error al obtener accesorio:", error);
    return NextResponse.json(
      { error: "Error al obtener accesorio" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un accesorio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que el accesorio existe
    const accesorioExistente = await prisma.accesorio.findUnique({
      where: { id },
    });

    if (!accesorioExistente) {
      return NextResponse.json(
        { error: "Accesorio no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log("📥 Datos recibidos para actualizar:", JSON.stringify(body, null, 2));

    const {
      marcaId,
      modelo,
      precio,
      descripcion,
      featured,
      colores,
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

    // Actualizar el accesorio usando transacción
    const accesorio = await prisma.$transaction(async (tx) => {
      // Eliminar colores e imágenes existentes
      await tx.accesorioColor.deleteMany({
        where: { accesorioId: id },
      });

      // Eliminar imágenes generales del producto (no las de colores, que se eliminan con cascade)
      await tx.imagenProducto.deleteMany({
        where: { 
          accesorioId: id,
          accesorioColorId: null, // Solo eliminar imágenes generales
        },
      });

      // Crear colores con sus imágenes
      const coloresConImagenes = await Promise.all(
        colores.map(async (c: any) => {
          const colorCreado = await tx.accesorioColor.create({
            data: {
              accesorioId: id,
              colorId: parseInt(c.colorId),
              stock: parseInt(c.stock || 0),
              imagenes: {
                create: (c.imagenes || []).map((url: string, imgIndex: number) => ({
                  url,
                  tipo: imgIndex === 0 ? "principal" : "galeria",
                  orden: imgIndex,
                })),
              },
            },
          });
          return colorCreado;
        })
      );

      // Actualizar datos del accesorio con imágenes generales
      const accesorioActualizado = await tx.accesorio.update({
        where: { id },
        data: {
          marcaId: parseInt(marcaId),
          modelo: modelo.trim(),
          precio: parseFloat(precio),
          descripcion: descripcion.trim(),
          featured: featured === true || featured === "true",
          stock: 0, // Se recalculará después
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

      return accesorioActualizado;
    });

    // Recalcular y actualizar el stock total
    await updateAccesorioStock(id);

    // Obtener el accesorio actualizado
    const accesorioFinal = await prisma.accesorio.findUnique({
      where: { id },
      include: {
        marca: true,
        colores: {
          include: {
            color: true,
          },
        },
        imagenes: true,
      },
    });

    return NextResponse.json(accesorioFinal);
  } catch (error: any) {
    console.error("Error al actualizar accesorio:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar accesorio" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un accesorio (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que el accesorio existe
    const accesorio = await prisma.accesorio.findUnique({
      where: { id },
    });

    if (!accesorio) {
      return NextResponse.json(
        { error: "Accesorio no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete: cambiar activo a false
    await prisma.accesorio.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ message: "Accesorio eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar accesorio:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar accesorio" },
      { status: 500 }
    );
  }
}

