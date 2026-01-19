/**
 * Script para verificar la estructura de las tablas
 */

import { config } from "dotenv";
import { resolve } from "path";
import mariadb from "mariadb";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL no está definida");
}

const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
if (!match) {
  throw new Error(`Formato de DATABASE_URL inválido: ${dbUrl}`);
}

const [, user, password, host, port, database] = match;

const poolConfig = {
  host: host,
  port: parseInt(port),
  user: decodeURIComponent(user),
  password: decodeURIComponent(password),
  database: database,
  ssl: host.includes("railway") || host.includes("rlwy.net") 
    ? { rejectUnauthorized: false } 
    : undefined,
};

async function check() {
  const pool = mariadb.createPool(poolConfig);
  const connection = await pool.getConnection();

  try {
    console.log("🔍 Verificando estructura de tablas...\n");

    // Verificar columnas de TelefonoSeminuevo
    console.log("📋 Columnas de TelefonoSeminuevo:");
    const columns = await connection.query("SHOW COLUMNS FROM TelefonoSeminuevo") as any[];
    if (Array.isArray(columns)) {
      columns.forEach((col: any) => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
    }

    // Verificar datos en TelefonoSeminuevo
    console.log("\n📋 Datos en TelefonoSeminuevo:");
    const telefonos = await connection.query("SELECT id, marcaId, modeloId, modelo FROM TelefonoSeminuevo LIMIT 5") as any[];
    if (Array.isArray(telefonos) && telefonos.length > 0) {
      telefonos.forEach((t: any) => {
        console.log(`   - ID: ${t.id}, marcaId: ${t.marcaId}, modeloId: ${t.modeloId || 'NULL'}, modelo: ${t.modelo || 'NULL'}`);
      });
    } else {
      console.log("   (No hay teléfonos seminuevos)");
    }

    // Verificar tabla Modelo
    console.log("\n📋 Datos en Modelo:");
    const modelos = await connection.query("SELECT * FROM Modelo") as any[];
    if (Array.isArray(modelos) && modelos.length > 0) {
      modelos.forEach((m: any) => {
        console.log(`   - ID: ${m.id}, marcaId: ${m.marcaId}, nombre: ${m.nombre}`);
      });
    } else {
      console.log("   (No hay modelos)");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

check()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
