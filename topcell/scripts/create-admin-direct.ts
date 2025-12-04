/**
 * Script alternativo para crear el primer administrador
 * Usa mysql2 directamente en lugar de Prisma para evitar problemas con el adapter
 */

import "dotenv/config";
import { createPool } from "mysql2/promise";
import bcrypt from "bcrypt";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL no está definida");
      process.exit(1);
    }

    // Parsear DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);

    if (!match) {
      console.error(`❌ Formato de DATABASE_URL inválido: ${dbUrl}`);
      process.exit(1);
    }

    const [, user, password, host, port, database] = match;

    // Crear pool de conexiones
    const pool = createPool({
      host: host,
      port: parseInt(port),
      user: decodeURIComponent(user),
      password: decodeURIComponent(password),
      database: database,
      connectionLimit: 5,
      connectTimeout: 30000,
      ssl: host.includes("railway") || host.includes("rlwy.net") 
        ? { rejectUnauthorized: false } 
        : undefined,
    });

    console.log("=== Crear Administrador ===\n");

    const email = await question("Email: ");
    const nombre = await question("Nombre: ");
    const passwordInput = await question("Contraseña: ");
    const rol = await question("Rol (admin/superadmin) [admin]: ") || "admin";

    // Verificar si ya existe
    const [existing] = await pool.query(
      "SELECT id FROM UsuarioAdmin WHERE email = ?",
      [email]
    ) as any[];

    if (Array.isArray(existing) && existing.length > 0) {
      console.log("\n❌ Ya existe un administrador con ese email");
      rl.close();
      await pool.end();
      process.exit(1);
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(passwordInput, 10);

    // Crear administrador
    const [result] = await pool.query(
      `INSERT INTO UsuarioAdmin (email, nombre, passwordHash, rol, activo, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [email, nombre, passwordHash, rol, true]
    ) as any[];

    const insertId = (result as any).insertId;

    console.log("\n✅ Administrador creado exitosamente!");
    console.log(`ID: ${insertId}`);
    console.log(`Email: ${email}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Rol: ${rol}`);

    rl.close();
    await pool.end();
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.code) {
      console.error("   Código:", error.code);
    }
    rl.close();
    process.exit(1);
  }
}

createAdmin();

