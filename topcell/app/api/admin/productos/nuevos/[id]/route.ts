import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTelefonoNuevoStock } from "@/lib/product-utils";

// GET - Obtener un teléfono específico
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

    const telefono = await prisma.telefonoNuevo.findUnique({
      where: { id },
      include: {
        marca: true,
        variantes: {
          include: {
            color: true,
          },
        },
        imagenes: true,
      },
    });

    if (!telefono) {
      return NextResponse.json(
        { error: "Teléfono no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(telefono);
  } catch (error: any) {
    console.error("Error al obtener teléfono:", error);
    return NextResponse.json(
      { error: "Error al obtener teléfono" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un teléfono
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

    // Verificar que el teléfono existe
    const telefonoExistente = await prisma.telefonoNuevo.findUnique({
      where: { id },
    });

    if (!telefonoExistente) {
      return NextResponse.json(
        { error: "Teléfono no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log("📥 Datos recibidos para actualizar:", JSON.stringify(body, null, 2));

    const {
      marcaId,
      modelo,
      precio,
      procesador,
      ram,
      mpxlsCamara,
      tamanoPantalla,
      tipoEntrada,
      descripcion,
      featured,
      colores, // variantes
      imagenes,
    } = body;

    // Validar campos requeridos
    const camposFaltantes: string[] = [];
    if (!marcaId) camposFaltantes.push("Marca");
    if (!modelo || modelo.trim() === "") camposFaltantes.push("Modelo");
    if (!precio || precio === "") camposFaltantes.push("Precio");
    if (!procesador || procesador.trim() === "") camposFaltantes.push("Procesador");
    if (!ram || ram.trim() === "") camposFaltantes.push("RAM");
    if (!mpxlsCamara || mpxlsCamara.trim() === "") camposFaltantes.push("Cámara (MPXls)");
    if (!tamanoPantalla || tamanoPantalla.trim() === "") camposFaltantes.push("Tamaño de Pantalla");
    if (!tipoEntrada || tipoEntrada.trim() === "") camposFaltantes.push("Tipo de Entrada");

    if (camposFaltantes.length > 0) {
      return NextResponse.json(
        {
          error: `Faltan campos requeridos: ${camposFaltantes.join(", ")}`,
          camposFaltantes,
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos una variante
    if (!colores || !Array.isArray(colores) || colores.length === 0) {
      return NextResponse.json(
        { error: "Debe tener al menos una variante (color + almacenamiento + stock)" },
        { status: 400 }
      );
    }

    // Validar que cada variante tenga los campos requeridos
    const variantesInvalidas: string[] = [];
    colores.forEach((v: any, index: number) => {
      if (!v.colorId) variantesInvalidas.push(`Variante ${index + 1}: falta el color`);
      if (!v.rom || v.rom.trim() === "") variantesInvalidas.push(`Variante ${index + 1}: falta el almacenamiento (ROM)`);
      if (v.stock === undefined || v.stock === null || v.stock === "") {
        variantesInvalidas.push(`Variante ${index + 1}: falta el stock`);
      }
    });

    if (variantesInvalidas.length > 0) {
      return NextResponse.json(
        {
          error: `Variantes incompletas: ${variantesInvalidas.join(", ")}`,
          variantesInvalidas,
        },
        { status: 400 }
      );
    }

    // Actualizar el teléfono usando transacción para actualizar variantes e imágenes
    const telefono = await prisma.$transaction(async (tx) => {
      // Eliminar variantes existentes
      await tx.telefonoNuevoVariante.deleteMany({
        where: { telefonoNuevoId: id },
      });

      // Eliminar imágenes existentes
      await tx.imagenProducto.deleteMany({
        where: { telefonoNuevoId: id },
      });

      // Actualizar datos del teléfono
      const telefonoActualizado = await tx.telefonoNuevo.update({
        where: { id },
        data: {
          marcaId: parseInt(marcaId),
          modelo,
          precio: parseFloat(precio),
          procesador,
          ram,
          mpxlsCamara,
          tamanoPantalla,
          tipoEntrada,
          descripcion: descripcion || null,
          featured: featured === true || featured === "true",
          stock: 0, // Se recalculará después
          variantes: {
            create: colores.map((v: any) => ({
              colorId: parseInt(v.colorId),
              rom: v.rom,
              stock: parseInt(v.stock || 0),
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
          variantes: {
            include: {
              color: true,
            },
          },
          imagenes: true,
        },
      });

      return telefonoActualizado;
    });

    // Recalcular y actualizar el stock total
    await updateTelefonoNuevoStock(id);

    // Obtener el teléfono actualizado con el stock recalculado
    const telefonoFinal = await prisma.telefonoNuevo.findUnique({
      where: { id },
      include: {
        marca: true,
        variantes: {
          include: {
            color: true,
          },
        },
        imagenes: true,
      },
    });

    return NextResponse.json(telefonoFinal);
  } catch (error: any) {
    console.error("Error al actualizar teléfono:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar teléfono" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un teléfono (soft delete)
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

    // Verificar que el teléfono existe
    const telefono = await prisma.telefonoNuevo.findUnique({
      where: { id },
    });

    if (!telefono) {
      return NextResponse.json(
        { error: "Teléfono no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete: cambiar activo a false
    await prisma.telefonoNuevo.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ message: "Teléfono eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar teléfono:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar teléfono" },
      { status: 500 }
    );
  }
}

