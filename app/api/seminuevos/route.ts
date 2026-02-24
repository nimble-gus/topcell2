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

    // Agrupar por marca, deduplicando por (marca, modelo)
    const porModelo = new Map<string, { marca: any; id: number; modelo: string; imagenUrl: string | null; precioMinimo: number }>();
    for (const telefono of telefonos) {
      if (telefono.variantes.length === 0) continue;
      const marcaNombre = telefono.marca.nombre;
      const modeloNombre = telefono.modelo?.nombre || "Sin modelo";
      const key = `${marcaNombre}|${modeloNombre}`;
      const precioMin = Math.min(...telefono.variantes.map((v) => Number(v.precio)));
      const existente = porModelo.get(key);
      if (!existente || precioMin < existente.precioMinimo) {
        porModelo.set(key, {
          marca: { id: telefono.marca.id, nombre: marcaNombre, logoUrl: telefono.marca.logoUrl },
          id: telefono.id,
          modelo: modeloNombre,
          imagenUrl: telefono.modelo?.imagenes?.[0]?.url || null,
          precioMinimo: precioMin,
        });
      }
    }
    const telefonosPorMarca = Object.create(null) as Record<string, { marca: any; modelos: any[] }>;
    for (const entry of porModelo.values()) {
      const { marca, id, modelo, imagenUrl, precioMinimo } = entry;
      if (!telefonosPorMarca[marca.nombre]) {
        telefonosPorMarca[marca.nombre] = { marca, modelos: [] };
      }
      telefonosPorMarca[marca.nombre].modelos.push({ id, modelo, imagenUrl, precioMinimo });
    }

    return NextResponse.json(Object.values(telefonosPorMarca));
  } catch (error: any) {
    console.error("Error al obtener teléfonos seminuevos:", error);
    return NextResponse.json(
      { error: "Error al obtener teléfonos seminuevos" },
      { status: 500 }
    );
  }
}
