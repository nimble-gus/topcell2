/**
 * Script para crear el primer administrador
 * Ejecutar con: npx tsx scripts/create-admin.ts
 * 
 * O con ts-node: npx ts-node scripts/create-admin.ts
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";
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
    console.log("=== Crear Administrador ===\n");

    const email = await question("Email: ");
    const nombre = await question("Nombre: ");
    const password = await question("Contraseña: ");
    const rol = await question("Rol (admin/superadmin) [admin]: ") || "admin";

    // Verificar si ya existe
    const existing = await prisma.usuarioAdmin.findUnique({
      where: { email },
    });

    if (existing) {
      console.log("\n❌ Ya existe un administrador con ese email");
      rl.close();
      process.exit(1);
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear administrador
    const admin = await prisma.usuarioAdmin.create({
      data: {
        email,
        nombre,
        passwordHash,
        rol: rol as "admin" | "superadmin",
      },
    });

    console.log("\n✅ Administrador creado exitosamente!");
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Nombre: ${admin.nombre}`);
    console.log(`Rol: ${admin.rol}`);

    rl.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error("\n❌ Error:", error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();

