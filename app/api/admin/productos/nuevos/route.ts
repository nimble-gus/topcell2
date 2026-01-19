import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTelefonoNuevoStock } from "@/lib/product-utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const telefonos = await prisma.telefonoNuevo.findMany({
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
    console.error("Error al obtener teléfonos nuevos:", error);
    return NextResponse.json(
      { error: "Error al obtener teléfonos nuevos" },
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
      procesador,
      ram,
      rom,
      mpxlsCamara,
      tamanoPantalla,
      tipoEntrada,
      stock,
      descripcion,
      featured,
      variantes, // variantes con imágenes
      colores, // mantener compatibilidad con código antiguo
      imagenes,
    } = body;

    // Usar variantes si está disponible, sino usar colores (compatibilidad)
    const variantesData = variantes || (colores ? colores.map((c: any) => ({ ...c, imagenes: [] })) : []);

    // Validar campos requeridos y mostrar cuáles faltan
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
          camposFaltantes 
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos una variante
    if (!variantesData || !Array.isArray(variantesData) || variantesData.length === 0) {
      return NextResponse.json(
        { error: "Debe crear al menos una variante (color + almacenamiento + stock)" },
        { status: 400 }
      );
    }

    // Validar que cada variante tenga los campos requeridos
    const variantesInvalidas: string[] = [];
    variantesData.forEach((v: any, index: number) => {
      if (!v.colorId) variantesInvalidas.push(`Variante ${index + 1}: falta el color`);
      if (!v.rom || v.rom.trim() === "") variantesInvalidas.push(`Variante ${index + 1}: falta el almacenamiento (ROM)`);
      if (v.precio === undefined || v.precio === null || v.precio === "" || parseFloat(v.precio) <= 0) {
        variantesInvalidas.push(`Variante ${index + 1}: falta el precio o es inválido`);
      }
      if (v.stock === undefined || v.stock === null || v.stock === "") {
        variantesInvalidas.push(`Variante ${index + 1}: falta el stock`);
      }
    });

    if (variantesInvalidas.length > 0) {
      return NextResponse.json(
        { 
          error: `Variantes incompletas: ${variantesInvalidas.join(", ")}`,
          variantesInvalidas 
        },
        { status: 400 }
      );
    }

    // Crear el teléfono (el stock se calculará después)
    const telefono = await prisma.telefonoNuevo.create({
      data: {
        marcaId: parseInt(marcaId),
        modelo,
        precio: parseFloat(precio),
        procesador,
        ram,
        rom: "128GB", // ROM por defecto (las variantes tienen su propio ROM, este campo es solo referencia)
        mpxlsCamara,
        tamanoPantalla,
        tipoEntrada,
        stock: 0, // Se calculará después desde las variantes
        descripcion: descripcion || null,
        featured: featured === true || featured === "true",
        variantes: {
          create: variantesData.map((v: any) => ({
            colorId: parseInt(v.colorId),
            rom: v.rom || rom || "128GB",
            precio: parseFloat(v.precio || precio || 0),
            stock: parseInt(v.stock || 0),
            imagenes: {
              create: (v.imagenes || []).map((url: string, imgIndex: number) => ({
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
        variantes: {
          include: {
            color: true,
          },
        },
      },
    });

    // Recalcular y actualizar el stock total
    await updateTelefonoNuevoStock(telefono.id);

    return NextResponse.json(telefono, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear teléfono nuevo:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear teléfono nuevo" },
      { status: 500 }
    );
  }
}

