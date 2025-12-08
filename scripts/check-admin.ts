/**
 * Script para verificar un usuario admin en la base de datos
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function checkAdmin() {
  const email = process.argv[2] || "admin@topcell.com";

  try {
    console.log(`🔍 Buscando usuario: ${email}`);
    
    const admin = await prisma.usuarioAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      console.log("❌ Usuario no encontrado");
      return;
    }

    console.log("✅ Usuario encontrado:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nombre: ${admin.nombre}`);
    console.log(`   Rol: ${admin.rol}`);
    console.log(`   Activo: ${admin.activo}`);
    console.log(`   Password Hash: ${admin.passwordHash.substring(0, 20)}...`);
    console.log(`   Creado: ${admin.createdAt}`);
    console.log(`   Último login: ${admin.lastLogin || "Nunca"}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();

