/// <reference types="node" />

/**
 * ⚠️ SCRIPT OBSOLETO
 * Este script estaba diseñado para migrar datos de TelefonoNuevoColor a TelefonoNuevoVariante,
 * pero el schema actual ya no tiene la tabla TelefonoNuevoColor.
 * 
 * Si necesitas migrar datos antiguos, deberás usar SQL directo o actualizar este script
 * para trabajar con el schema actual que ya usa variantes.
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Inicializar Prisma para scripts (sin server-only)
function getPoolConfig() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL no está definida");
  
  const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error(`Formato de DATABASE_URL inválido: ${dbUrl}`);
  
  const [, user, password, host, port, database] = match;
  return {
    host,
    port: parseInt(port),
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    database,
    connectionLimit: 5,
    connectTimeout: 60000,
    ssl: host.includes("railway") || host.includes("rlwy.net")
      ? { rejectUnauthorized: false }
      : undefined,
  };
}

const poolConfig = getPoolConfig();
const adapter = new PrismaMariaDb(poolConfig);
const prisma = new PrismaClient({ adapter });

async function migrateToVariantes() {
  try {
    console.log("⚠️  Este script está obsoleto.");
    console.log("⚠️  El schema actual ya usa variantes, no colores.");
    console.log("⚠️  Si necesitas migrar datos antiguos, usa SQL directo o actualiza este script.");
    
    // Verificar si hay teléfonos sin variantes
    const telefonosNuevos = await prisma.telefonoNuevo.findMany({
      include: {
        variantes: true,
      },
    });

    const telefonosSinVariantes = telefonosNuevos.filter(t => t.variantes.length === 0);
    
    if (telefonosSinVariantes.length > 0) {
      console.log(`\n📱 Encontrados ${telefonosSinVariantes.length} teléfonos nuevos sin variantes`);
      console.log("⚠️  Estos teléfonos necesitan variantes para funcionar correctamente.");
      console.log("⚠️  Crea variantes manualmente desde el admin o actualiza este script.");
    } else {
      console.log("\n✅ Todos los teléfonos nuevos tienen variantes.");
    }

    // Verificar teléfonos seminuevos
    const telefonosSeminuevos = await prisma.telefonoSeminuevo.findMany({
      include: {
        variantes: true,
      },
    });

    const seminuevosSinVariantes = telefonosSeminuevos.filter(t => t.variantes.length === 0);
    
    if (seminuevosSinVariantes.length > 0) {
      console.log(`\n📱 Encontrados ${seminuevosSinVariantes.length} teléfonos seminuevos sin variantes`);
      console.log("⚠️  Estos teléfonos necesitan variantes para funcionar correctamente.");
    } else {
      console.log("\n✅ Todos los teléfonos seminuevos tienen variantes.");
    }

    console.log("\n✅ Verificación completada");
  } catch (error: any) {
    console.error("❌ Error en la verificación:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToVariantes();

