import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createPool } from "mariadb";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

// Configurar pool de conexiones
const pool = createPool({
  uri: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionLimit: 5,
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function migratePrecioVariantes() {
  console.log("🔄 Iniciando migración de precios a variantes...");

  try {
    // Obtener todos los teléfonos nuevos con sus variantes
    const telefonos = await prisma.telefonoNuevo.findMany({
      include: {
        variantes: true,
      },
    });

    console.log(`📱 Encontrados ${telefonos.length} teléfonos nuevos`);

    let variantesActualizadas = 0;

    for (const telefono of telefonos) {
      const precioTelefono = Number(telefono.precio);

      for (const variante of telefono.variantes) {
        // Si la variante no tiene precio, asignarle el precio del teléfono
        if (!variante.precio) {
          await prisma.telefonoNuevoVariante.update({
            where: { id: variante.id },
            data: {
              precio: precioTelefono,
            },
          });
          variantesActualizadas++;
          console.log(
            `  ✓ Variante ${variante.id} (${variante.rom}) actualizada con precio Q${precioTelefono}`
          );
        }
      }
    }

    console.log(
      `\n✅ Migración completada: ${variantesActualizadas} variantes actualizadas`
    );
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

migratePrecioVariantes()
  .then(() => {
    console.log("✅ Migración finalizada exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });

