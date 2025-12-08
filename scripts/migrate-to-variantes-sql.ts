/**
 * Script para migrar datos usando SQL directo
 * Migra de TelefonoNuevoColor a TelefonoNuevoVariante
 */

import "dotenv/config";
import { createPool } from "mariadb";

function parseDatabaseUrl() {
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

async function migrateToVariantes() {
  const pool = createPool(parseDatabaseUrl());
  const conn = await pool.getConnection();

  try {
    console.log("🔄 Iniciando migración a sistema de variantes...");

    // Verificar si existe la tabla TelefonoNuevoColor y TelefonoNuevoVariante
    const dbName = parseDatabaseUrl().database;
    const tablesResult = await conn.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('TelefonoNuevoColor', 'TelefonoNuevoVariante', 'TelefonoSeminuevoColor', 'TelefonoSeminuevoVariante')
    `, [dbName]);

    // mysql2 devuelve [rows, fields], necesitamos solo rows
    const tables = Array.isArray(tablesResult) && Array.isArray(tablesResult[0]) 
      ? tablesResult[0] 
      : Array.isArray(tablesResult) 
        ? tablesResult 
        : [];

    const tableNames = tables.map((t: any) => t.TABLE_NAME || t.table_name);
    const hasOldTable = tableNames.includes('TelefonoNuevoColor');
    const hasNewTable = tableNames.includes('TelefonoNuevoVariante');
    const hasOldSeminuevoTable = tableNames.includes('TelefonoSeminuevoColor');
    const hasNewSeminuevoTable = tableNames.includes('TelefonoSeminuevoVariante');

    if (!hasOldTable) {
      console.log("ℹ️  No existe la tabla TelefonoNuevoColor, no hay datos que migrar");
      if (!hasNewTable) {
        console.log("⚠️  La tabla TelefonoNuevoVariante tampoco existe. Ejecuta 'npm run prisma:push' primero.");
      }
      return;
    }

    if (!hasNewTable) {
      console.log("📦 Creando tabla TelefonoNuevoVariante...");
      await conn.query(`
        CREATE TABLE IF NOT EXISTS TelefonoNuevoVariante (
          id INT AUTO_INCREMENT PRIMARY KEY,
          telefonoNuevoId INT NOT NULL,
          colorId INT NOT NULL,
          rom VARCHAR(50) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_variante (telefonoNuevoId, colorId, rom),
          KEY idx_telefonoNuevoId (telefonoNuevoId),
          KEY idx_colorId (colorId),
          FOREIGN KEY (telefonoNuevoId) REFERENCES TelefonoNuevo(id) ON DELETE CASCADE,
          FOREIGN KEY (colorId) REFERENCES Color(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Tabla TelefonoNuevoVariante creada");
    }

    if (!hasNewSeminuevoTable && hasOldSeminuevoTable) {
      console.log("📦 Creando tabla TelefonoSeminuevoVariante...");
      await conn.query(`
        CREATE TABLE IF NOT EXISTS TelefonoSeminuevoVariante (
          id INT AUTO_INCREMENT PRIMARY KEY,
          telefonoSeminuevoId INT NOT NULL,
          colorId INT NOT NULL,
          rom VARCHAR(50) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_variante (telefonoSeminuevoId, colorId, rom),
          KEY idx_telefonoSeminuevoId (telefonoSeminuevoId),
          KEY idx_colorId (colorId),
          FOREIGN KEY (telefonoSeminuevoId) REFERENCES TelefonoSeminuevo(id) ON DELETE CASCADE,
          FOREIGN KEY (colorId) REFERENCES Color(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Tabla TelefonoSeminuevoVariante creada");
    }

    // Obtener datos de TelefonoNuevoColor
    const coloresResult = await conn.query(`
      SELECT tnc.*, tn.rom, tn.modelo
      FROM TelefonoNuevoColor tnc
      INNER JOIN TelefonoNuevo tn ON tnc.telefonoNuevoId = tn.id
    `);

    const coloresData = Array.isArray(coloresResult) && Array.isArray(coloresResult[0])
      ? coloresResult[0]
      : Array.isArray(coloresResult)
        ? coloresResult
        : [];

    console.log(`📱 Encontrados ${coloresData.length} registros en TelefonoNuevoColor`);

    let migrated = 0;
    for (const colorData of coloresData) {
      const rom = colorData.rom || "128GB";
      
      try {
        await conn.query(`
          INSERT INTO TelefonoNuevoVariante (telefonoNuevoId, colorId, rom, stock, createdAt)
          VALUES (?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE stock = VALUES(stock)
        `, [colorData.telefonoNuevoId, colorData.colorId, rom, colorData.stock || 0]);

        migrated++;
        console.log(`  ✅ Variante migrada: ${colorData.modelo} - Color ID ${colorData.colorId} - ${rom} (Stock: ${colorData.stock || 0})`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  Variante ya existe: ${colorData.modelo} - Color ID ${colorData.colorId} - ${rom}`);
        } else {
          console.error(`  ❌ Error migrando variante:`, error.message);
        }
      }
    }

    // Recalcular stock total para cada teléfono
    const telefonosResult = await conn.query(`
      SELECT DISTINCT telefonoNuevoId FROM TelefonoNuevoVariante
    `);

    const telefonos = Array.isArray(telefonosResult) && Array.isArray(telefonosResult[0])
      ? telefonosResult[0]
      : Array.isArray(telefonosResult)
        ? telefonosResult
        : [];

    for (const tel of telefonos) {
      const stockResult = await conn.query(`
        SELECT SUM(stock) as totalStock
        FROM TelefonoNuevoVariante
        WHERE telefonoNuevoId = ?
      `, [tel.telefonoNuevoId]);

      const stockRows = Array.isArray(stockResult) && Array.isArray(stockResult[0])
        ? stockResult[0]
        : Array.isArray(stockResult)
          ? stockResult
          : [];
      
      const totalStock = stockRows[0]?.totalStock || 0;

      await conn.query(`
        UPDATE TelefonoNuevo
        SET stock = ?
        WHERE id = ?
      `, [totalStock, tel.telefonoNuevoId]);
    }

    // Migrar teléfonos seminuevos si existen
    if (hasOldSeminuevoTable && hasNewSeminuevoTable) {
      const seminuevosResult = await conn.query(`
        SELECT tsc.*, ts.rom, ts.modelo
        FROM TelefonoSeminuevoColor tsc
        INNER JOIN TelefonoSeminuevo ts ON tsc.telefonoSeminuevoId = ts.id
      `);

      const seminuevosData = Array.isArray(seminuevosResult) && Array.isArray(seminuevosResult[0])
        ? seminuevosResult[0]
        : Array.isArray(seminuevosResult)
          ? seminuevosResult
          : [];

      console.log(`📱 Encontrados ${seminuevosData.length} registros en TelefonoSeminuevoColor`);

      for (const colorData of seminuevosData) {
        const rom = colorData.rom || "128GB";
        
        try {
          await conn.query(`
            INSERT INTO TelefonoSeminuevoVariante (telefonoSeminuevoId, colorId, rom, stock, createdAt)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE stock = VALUES(stock)
          `, [colorData.telefonoSeminuevoId, colorData.colorId, rom, colorData.stock || 0]);

          migrated++;
          console.log(`  ✅ Variante seminuevo migrada: ${colorData.modelo} - Color ID ${colorData.colorId} - ${rom} (Stock: ${colorData.stock || 0})`);
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`  ⚠️  Variante ya existe: ${colorData.modelo} - Color ID ${colorData.colorId} - ${rom}`);
          } else {
            console.error(`  ❌ Error migrando variante:`, error.message);
          }
        }
      }

      // Recalcular stock para seminuevos
      const seminuevosResult2 = await conn.query(`
        SELECT DISTINCT telefonoSeminuevoId FROM TelefonoSeminuevoVariante
      `);

      const seminuevos = Array.isArray(seminuevosResult2) && Array.isArray(seminuevosResult2[0])
        ? seminuevosResult2[0]
        : Array.isArray(seminuevosResult2)
          ? seminuevosResult2
          : [];

      for (const tel of seminuevos) {
        const stockResult = await conn.query(`
          SELECT SUM(stock) as totalStock
          FROM TelefonoSeminuevoVariante
          WHERE telefonoSeminuevoId = ?
        `, [tel.telefonoSeminuevoId]);

        const stockRows = Array.isArray(stockResult) && Array.isArray(stockResult[0])
          ? stockResult[0]
          : Array.isArray(stockResult)
            ? stockResult
            : [];
        
        const totalStock = stockRows[0]?.totalStock || 0;

        await conn.query(`
          UPDATE TelefonoSeminuevo
          SET stock = ?
          WHERE id = ?
        `, [totalStock, tel.telefonoSeminuevoId]);
      }
    }

    console.log(`✅ Migración completada: ${migrated} variantes migradas`);
    console.log("⚠️  Ahora puedes ejecutar 'npm run prisma:push' para aplicar el schema completo");
  } catch (error: any) {
    console.error("❌ Error en la migración:", error);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrateToVariantes();

