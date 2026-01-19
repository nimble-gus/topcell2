/**
 * Script para verificar que la migración se completó correctamente
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

async function verify() {
  const pool = mariadb.createPool(poolConfig);
  const connection = await pool.getConnection();

  try {
    console.log("🔍 Verificando migración...\n");

    // Verificar modelos creados
    const [modelos] = await connection.query("SELECT COUNT(*) as count FROM Modelo") as any[];
    console.log(`✅ Modelos en la tabla Modelo: ${modelos[0]?.count || 0}`);

    // Verificar teléfonos seminuevos con modeloId
    const [telefonos] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM TelefonoSeminuevo 
      WHERE modeloId IS NOT NULL
    `) as any[];
    console.log(`✅ Teléfonos seminuevos con modeloId: ${telefonos[0]?.count || 0}`);

    // Verificar imágenes migradas
    const [imagenes] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM ImagenProducto 
      WHERE modeloId IS NOT NULL
    `) as any[];
    console.log(`✅ Imágenes con modeloId: ${imagenes[0]?.count || 0}`);

    // Mostrar modelos creados
    const [modelosList] = await connection.query(`
      SELECT m.id, m.nombre, ma.nombre as marcaNombre, 
             COUNT(ts.id) as telefonosCount
      FROM Modelo m
      INNER JOIN Marca ma ON m.marcaId = ma.id
      LEFT JOIN TelefonoSeminuevo ts ON ts.modeloId = m.id
      GROUP BY m.id, m.nombre, ma.nombre
    `) as any[];
    
    console.log("\n📋 Modelos creados:");
    if (Array.isArray(modelosList) && modelosList.length > 0) {
      modelosList.forEach((m: any) => {
        console.log(`   - ${m.marcaNombre} ${m.nombre} (${m.telefonosCount} teléfonos)`);
      });
    } else {
      console.log("   (Ningún modelo encontrado)");
    }

    console.log("\n✅ Verificación completada");

  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
