import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTelefonoSeminuevoStock } from "@/lib/product-utils";

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

    const telefono = await prisma.telefonoSeminuevo.findUnique({
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
    const telefonoExistente = await prisma.telefonoSeminuevo.findUnique({
      where: { id },
      include: { marca: true },
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
      variantes,
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
    if (!variantes || !Array.isArray(variantes) || variantes.length === 0) {
      return NextResponse.json(
        { error: "Debe tener al menos una variante" },
        { status: 400 }
      );
    }

    // Obtener la marca para verificar si es iPhone
    const marca = await prisma.marca.findUnique({
      where: { id: parseInt(marcaId) },
    });

    const esiPhone = marca?.nombre.toLowerCase().includes("apple") || marca?.nombre.toLowerCase().includes("iphone");

    // Validar variantes
    const variantesInvalidas: string[] = [];
    variantes.forEach((v: any, index: number) => {
      if (!v.colorId) variantesInvalidas.push(`Variante ${index + 1}: falta el color`);
      if (!v.rom || v.rom.trim() === "") variantesInvalidas.push(`Variante ${index + 1}: falta el almacenamiento (ROM)`);
      if (!v.estado || v.estado < 1 || v.estado > 10) {
        variantesInvalidas.push(`Variante ${index + 1}: el estado debe ser entre 1 y 10`);
      }
      if (!v.precio || v.precio === "") variantesInvalidas.push(`Variante ${index + 1}: falta el precio`);
      if (v.stock === undefined || v.stock === null || v.stock === "") {
        variantesInvalidas.push(`Variante ${index + 1}: falta el stock`);
      }
      if (esiPhone && (!v.porcentajeBateria || v.porcentajeBateria < 0 || v.porcentajeBateria > 100)) {
        variantesInvalidas.push(`Variante ${index + 1}: falta el porcentaje de batería (requerido para iPhone)`);
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

    // Actualizar el teléfono usando transacción
    const telefono = await prisma.$transaction(async (tx) => {
      // Eliminar variantes e imágenes existentes
      await tx.telefonoSeminuevoVariante.deleteMany({
        where: { telefonoSeminuevoId: id },
      });

      await tx.imagenProducto.deleteMany({
        where: { telefonoSeminuevoId: id },
      });

      // Actualizar datos del teléfono
      const telefonoActualizado = await tx.telefonoSeminuevo.update({
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
          stock: 0, // Se recalculará después
          variantes: {
            create: variantes.map((v: any) => ({
              colorId: parseInt(v.colorId),
              rom: v.rom,
              estado: parseInt(v.estado),
              precio: parseFloat(v.precio),
              porcentajeBateria: esiPhone ? parseInt(v.porcentajeBateria) : null,
              ciclosCarga: esiPhone && v.ciclosCarga ? parseInt(v.ciclosCarga) : null,
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
    await updateTelefonoSeminuevoStock(id);

    // Obtener el teléfono actualizado
    const telefonoFinal = await prisma.telefonoSeminuevo.findUnique({
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
    const telefono = await prisma.telefonoSeminuevo.findUnique({
      where: { id },
    });

    if (!telefono) {
      return NextResponse.json(
        { error: "Teléfono no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete: cambiar activo a false
    await prisma.telefonoSeminuevo.update({
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

