// Este archivo solo debe usarse en el servidor
// Marcar como server-only para evitar que se importe en el cliente
import "server-only";

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Singleton pattern para Prisma Client
// Previene múltiples instancias en desarrollo con hot reload

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaMariaDb | undefined;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

// Parsear DATABASE_URL
// Railway proporciona un host interno (.railway.internal) que solo funciona dentro de Railway
// Para conexiones externas, debemos usar el host público de DATABASE_URL
function getPoolConfig() {
  // Parsear DATABASE_URL que contiene el host público
  // Formato: mysql://user:password@host:port/database
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL no está definida en las variables de entorno");
  }
  
  // Extraer componentes de la URL manualmente para evitar problemas con caracteres especiales
  const match = dbUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  
  if (!match) {
    throw new Error(`Formato de DATABASE_URL inválido: ${dbUrl}`);
  }
  
  const [, user, password, host, port, database] = match;
  
  return {
    host: host,
    port: parseInt(port),
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    database: database,
    connectionLimit: 5,
    connectTimeout: 60000, // 60 segundos
    // Railway requiere SSL para conexiones externas
    ssl: host.includes("railway") || host.includes("rlwy.net") 
      ? { rejectUnauthorized: false } 
      : undefined,
  };
}

// Crear adapter de MariaDB (singleton)
// El adapter espera una configuración (PoolConfig o string), no un pool ya creado
// El pool se crea internamente cuando Prisma llama a connect()
const poolConfig = getPoolConfig();
const adapter =
  globalForPrisma.adapter ??
  new PrismaMariaDb(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adapter = adapter;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

