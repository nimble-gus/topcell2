import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Obtener inventario completo
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
    const tipo = searchParams.get("tipo") || ""; // "nuevo", "seminuevo", "accesorio"
    const search = searchParams.get("search") || "";

    const inventario: any = {
      telefonosNuevos: [],
      telefonosSeminuevos: [],
      accesorios: [],
    };

    // Obtener teléfonos nuevos con variantes
    if (!tipo || tipo === "nuevo") {
      const telefonosNuevos = await prisma.telefonoNuevo.findMany({
        where: {
          activo: true,
          ...(search && {
            OR: [
              { modelo: { contains: search } },
              { marca: { nombre: { contains: search } } },
            ],
          }),
        },
        include: {
          marca: true,
          variantes: {
            include: {
              color: true,
            },
            orderBy: [
              { color: { color: "asc" } },
              { rom: "asc" },
            ],
          },
        },
        orderBy: {
          marca: { nombre: "asc" },
        },
      });

      inventario.telefonosNuevos = telefonosNuevos.map((telefono) => ({
        id: telefono.id,
        tipo: "nuevo",
        marca: telefono.marca.nombre,
        modelo: telefono.modelo,
        variantes: telefono.variantes.map((v) => ({
          id: v.id,
          color: v.color.color,
          rom: v.rom,
          precio: Number(v.precio),
          stock: v.stock,
        })),
        stockTotal: telefono.variantes.reduce((sum, v) => sum + v.stock, 0),
      }));
    }

    // Obtener teléfonos seminuevos con variantes
    if (!tipo || tipo === "seminuevo") {
      const telefonosSeminuevos = await prisma.telefonoSeminuevo.findMany({
        where: {
          activo: true,
          ...(search && {
            OR: [
              { modelo: { nombre: { contains: search } } },
              { marca: { nombre: { contains: search } } },
            ],
          }),
        },
        include: {
          marca: true,
          modelo: true,
          variantes: {
            include: {
              color: true,
            },
            orderBy: [
              { color: { color: "asc" } },
              { rom: "asc" },
              { estado: "desc" },
            ],
          },
        },
        orderBy: {
          marca: { nombre: "asc" },
        },
      });

      inventario.telefonosSeminuevos = telefonosSeminuevos.map((telefono) => ({
        id: telefono.id,
        tipo: "seminuevo",
        marca: telefono.marca.nombre,
        modelo: telefono.modelo?.nombre || "Sin modelo",
        variantes: telefono.variantes.map((v) => ({
          id: v.id,
          color: v.color.color,
          rom: v.rom,
          estado: v.estado,
          porcentajeBateria: v.porcentajeBateria,
          precio: Number(v.precio),
          stock: v.stock,
        })),
        stockTotal: telefono.variantes.reduce((sum, v) => sum + v.stock, 0),
      }));
    }

    // Obtener accesorios con colores
    if (!tipo || tipo === "accesorio") {
      const accesorios = await prisma.accesorio.findMany({
        where: {
          activo: true,
          ...(search && {
            OR: [
              { modelo: { contains: search } },
              { marca: { nombre: { contains: search } } },
            ],
          }),
        },
        include: {
          marca: true,
          colores: {
            include: {
              color: true,
            },
            orderBy: {
              color: { color: "asc" },
            },
          },
        },
        orderBy: {
          marca: { nombre: "asc" },
        },
      });

      inventario.accesorios = accesorios.map((accesorio) => ({
        id: accesorio.id,
        tipo: "accesorio",
        marca: accesorio.marca.nombre,
        modelo: accesorio.modelo,
        precio: Number(accesorio.precio),
        colores: accesorio.colores.map((c) => ({
          id: c.id,
          color: c.color.color,
          stock: c.stock,
        })),
        stockTotal: accesorio.colores.reduce((sum, c) => sum + c.stock, 0),
      }));
    }

    // Calcular estadísticas
    const totalStock = {
      telefonosNuevos: inventario.telefonosNuevos.reduce(
        (sum: number, t: any) => sum + t.stockTotal,
        0
      ),
      telefonosSeminuevos: inventario.telefonosSeminuevos.reduce(
        (sum: number, t: any) => sum + t.stockTotal,
        0
      ),
      accesorios: inventario.accesorios.reduce(
        (sum: number, a: any) => sum + a.stockTotal,
        0
      ),
    };

    return NextResponse.json({
      inventario,
      estadisticas: {
        totalStock,
        totalGeneral: totalStock.telefonosNuevos + totalStock.telefonosSeminuevos + totalStock.accesorios,
        cantidadProductos: {
          telefonosNuevos: inventario.telefonosNuevos.length,
          telefonosSeminuevos: inventario.telefonosSeminuevos.length,
          accesorios: inventario.accesorios.length,
        },
      },
    });
  } catch (error: any) {
    console.error("Error al obtener inventario:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener inventario" },
      { status: 500 }
    );
  }
}

