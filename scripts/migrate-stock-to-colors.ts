/**
 * Script para migrar el stock de productos existentes a sus variantes
 * Este script asigna el stock del producto a las variantes existentes
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function migrateStock() {
  try {
    console.log("🔄 Iniciando migración de stock a variantes...");

    // Migrar teléfonos nuevos
    const telefonosNuevos = await prisma.telefonoNuevo.findMany({
      include: {
        variantes: {
          include: {
            color: true,
          },
        },
      },
    });

    for (const telefono of telefonosNuevos) {
      if (telefono.variantes.length > 0 && telefono.stock > 0) {
        // Distribuir el stock entre las variantes existentes
        const stockPorVariante = Math.floor(telefono.stock / telefono.variantes.length);
        const stockRestante = telefono.stock % telefono.variantes.length;

        for (let i = 0; i < telefono.variantes.length; i++) {
          const stock = stockPorVariante + (i < stockRestante ? 1 : 0);
          await prisma.telefonoNuevoVariante.update({
            where: { id: telefono.variantes[i].id },
            data: { stock },
          });
        }

        console.log(
          `✅ Migrado ${telefono.marcaId} ${telefono.modelo}: ${telefono.stock} unidades distribuidas en ${telefono.variantes.length} variantes`
        );
      }
    }

    // Migrar teléfonos seminuevos
    const telefonosSeminuevos = await prisma.telefonoSeminuevo.findMany({
      include: {
        variantes: {
          include: {
            color: true,
          },
        },
      },
    });

    for (const telefono of telefonosSeminuevos) {
      if (telefono.variantes.length > 0 && telefono.stock > 0) {
        const stockPorVariante = Math.floor(telefono.stock / telefono.variantes.length);
        const stockRestante = telefono.stock % telefono.variantes.length;

        for (let i = 0; i < telefono.variantes.length; i++) {
          const stock = stockPorVariante + (i < stockRestante ? 1 : 0);
          await prisma.telefonoSeminuevoVariante.update({
            where: { id: telefono.variantes[i].id },
            data: { stock },
          });
        }

        console.log(
          `✅ Migrado ${telefono.marcaId} ${telefono.modelo}: ${telefono.stock} unidades distribuidas en ${telefono.variantes.length} variantes`
        );
      }
    }

    // Migrar accesorios
    const accesorios = await prisma.accesorio.findMany({
      include: {
        colores: {
          include: {
            color: true,
          },
        },
      },
    });

    for (const accesorio of accesorios) {
      if (accesorio.colores.length > 0 && accesorio.stock > 0) {
        const stockPorColor = Math.floor(accesorio.stock / accesorio.colores.length);
        const stockRestante = accesorio.stock % accesorio.colores.length;

        for (let i = 0; i < accesorio.colores.length; i++) {
          const stock = stockPorColor + (i < stockRestante ? 1 : 0);
          await prisma.accesorioColor.update({
            where: { id: accesorio.colores[i].id },
            data: { stock },
          });
        }

        console.log(
          `✅ Migrado accesorio ID ${accesorio.id}: ${accesorio.stock} unidades distribuidas en ${accesorio.colores.length} colores`
        );
      }
    }

    console.log("✅ Migración completada exitosamente");
  } catch (error: any) {
    console.error("❌ Error en la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateStock();

