/**
 * Script para probar la conexión a la base de datos
 */

import "dotenv/config";
import { createPool } from "mysql2/promise";

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no está definida");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);

  if (!match) {
    console.error(`❌ Formato de DATABASE_URL inválido: ${dbUrl}`);
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  console.log("🔍 Configuración de conexión:");
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   User: ${user}`);
  console.log(`   Database: ${database}`);
  console.log(`   Password: ${password.substring(0, 3)}...`);
  console.log("");

  const pool = createPool({
    host: host,
    port: parseInt(port),
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    database: database,
    connectionLimit: 1,
    connectTimeout: 10000,
    ssl: host.includes("railway") || host.includes("rlwy.net") 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  try {
    console.log("🔄 Intentando conectar...");
    const connection = await pool.getConnection();
    console.log("✅ Conexión exitosa!");
    
    // Probar una query simple
    const [rows] = await connection.query("SELECT 1 as test");
    console.log("✅ Query de prueba exitosa:", rows);
    
    connection.release();
    await pool.end();
    console.log("✅ Conexión cerrada correctamente");
  } catch (error: any) {
    console.error("❌ Error de conexión:", error.message);
    console.error("   Código:", error.code);
    if (error.sqlState) {
      console.error("   SQL State:", error.sqlState);
    }
    await pool.end();
    process.exit(1);
  }
}

testConnection();

