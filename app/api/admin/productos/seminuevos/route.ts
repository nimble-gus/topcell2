import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTelefonoSeminuevoStock } from "@/lib/product-utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const telefonos = await prisma.telefonoSeminuevo.findMany({
      where: { activo: true },
      include: {
        marca: true,
        variantes: {
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

    return NextResponse.json(telefonos);
  } catch (error: any) {
    console.error("Error al obtener teléfonos seminuevos:", error);
    return NextResponse.json(
      { error: "Error al obtener teléfonos seminuevos" },
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
      modeloId,
      precio,
      procesador,
      ram,
      mpxlsCamara,
      tamanoPantalla,
      tipoEntrada,
      descripcion,
      variantes,
    } = body;

    // Validar campos requeridos
    const camposFaltantes: string[] = [];
    if (!marcaId) camposFaltantes.push("Marca");
    if (!modeloId) camposFaltantes.push("Modelo");
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
        { error: "Debe crear al menos una variante (color + almacenamiento + estado + precio + stock)" },
        { status: 400 }
      );
    }

    // Obtener la marca para verificar si es iPhone
    const marca = await prisma.marca.findUnique({
      where: { id: parseInt(marcaId) },
    });

    const esiPhone = marca?.nombre.toLowerCase().includes("apple") || marca?.nombre.toLowerCase().includes("iphone");

    // Validar que cada variante tenga los campos requeridos
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
      // Si es iPhone, el porcentaje de batería es obligatorio
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

    // Crear el teléfono
    const telefono = await prisma.telefonoSeminuevo.create({
      data: {
        marcaId: parseInt(marcaId),
        modeloId: parseInt(modeloId),
        precio: parseFloat(precio),
        procesador,
        ram,
        rom: "128GB", // ROM por defecto (las variantes tienen su propio ROM)
        mpxlsCamara,
        tamanoPantalla,
        tipoEntrada,
        stock: 0, // Se calculará después desde las variantes
        descripcion: descripcion || null,
        variantes: {
          create: variantes.map((v: any) => ({
            colorId: parseInt(v.colorId),
            rom: v.rom,
            estado: parseInt(v.estado),
            precio: parseFloat(v.precio),
            porcentajeBateria: esiPhone ? parseInt(v.porcentajeBateria) : null,
            ciclosCarga: esiPhone && v.ciclosCarga ? parseInt(v.ciclosCarga) : null,
            stock: parseInt(v.stock || 0),
            metodosPago: v.metodosPago && Array.isArray(v.metodosPago) && v.metodosPago.length > 0 ? v.metodosPago : null,
            imagenes: {
              create: (v.imagenes && Array.isArray(v.imagenes) && v.imagenes.length > 0 ? v.imagenes : []).map((url: string, imgIndex: number) => ({
                url,
                tipo: imgIndex === 0 ? "principal" : "galeria",
                orden: imgIndex,
              })),
            },
          })),
        },
      },
      include: {
        marca: true,
        modelo: {
          include: {
            imagenes: {
              orderBy: { orden: "asc" },
            },
          },
        },
        variantes: {
          include: {
            color: true,
            imagenes: {
              orderBy: { orden: "asc" },
            },
          },
        },
      },
    });

    // Recalcular y actualizar el stock total
    await updateTelefonoSeminuevoStock(telefono.id);

    return NextResponse.json(telefono, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear teléfono seminuevo:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear teléfono seminuevo" },
      { status: 500 }
    );
  }
}

