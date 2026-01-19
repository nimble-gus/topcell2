import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const telefonos = await prisma.telefonoSeminuevo.findMany({
      where: { activo: true },
      include: {
        marca: true,
        modelo: {
          include: {
            imagenes: {
              orderBy: { orden: "asc" },
              take: 1, // Solo la imagen principal
            },
          },
        },
        variantes: {
          where: {
            stock: { gt: 0 }, // Solo variantes con stock
          },
          include: {
            color: true,
          },
        },
      },
      orderBy: [
        { marca: { nombre: "asc" } },
        { modelo: { nombre: "asc" } },
      ],
    });

    // Agrupar por marca
    const telefonosPorMarca = telefonos.reduce((acc: any, telefono) => {
      const marcaNombre = telefono.marca.nombre;
      if (!acc[marcaNombre]) {
        acc[marcaNombre] = {
          marca: {
            id: telefono.marca.id,
            nombre: telefono.marca.nombre,
            logoUrl: telefono.marca.logoUrl,
          },
          modelos: [],
        };
      }
      
      // Solo incluir si tiene variantes con stock
      if (telefono.variantes.length > 0) {
        acc[marcaNombre].modelos.push({
          id: telefono.id,
          modelo: telefono.modelo?.nombre || "Sin modelo",
          imagenUrl: telefono.modelo?.imagenes[0]?.url || null,
          precioMinimo: Math.min(...telefono.variantes.map(v => Number(v.precio))),
        });
      }
      
      return acc;
    }, {});

    return NextResponse.json(Object.values(telefonosPorMarca));
  } catch (error: any) {
    console.error("Error al obtener teléfonos seminuevos:", error);
    return NextResponse.json(
      { error: "Error al obtener teléfonos seminuevos" },
      { status: 500 }
    );
  }
}
