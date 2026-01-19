/**
 * Script de migración segura para crear tabla Modelo y migrar datos existentes
 * 
 * Este script:
 * 1. Crea la tabla Modelo
 * 2. Migra los datos de TelefonoSeminuevo.modelo a Modelo
 * 3. Asigna modeloId a los teléfonos seminuevos existentes
 * 4. Migra las imágenes de TelefonoSeminuevo a Modelo
 * 
 * Ejecutar con: npx tsx scripts/migrate-to-modelos-safe.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import mariadb from "mariadb";

// Cargar variables de entorno
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

// Configuración de conexión
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

async function migrate() {
  const pool = mariadb.createPool(poolConfig);
  const connection = await pool.getConnection();

  try {
    console.log("🔄 Iniciando migración a sistema de Modelos...\n");

    // PASO 1: Verificar si la tabla Modelo ya existe
    const tablesResult = await connection.query(
      "SHOW TABLES LIKE 'Modelo'"
    ) as any[];
    
    const tables = Array.isArray(tablesResult) ? tablesResult : [];

    if (tables.length === 0) {
      console.log("📦 Paso 1: Creando tabla Modelo...");
      await connection.query(`
        CREATE TABLE \`Modelo\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`marcaId\` INT NOT NULL,
          \`nombre\` VARCHAR(191) NOT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`Modelo_marcaId_nombre_key\` (\`marcaId\`, \`nombre\`),
          INDEX \`Modelo_marcaId_idx\` (\`marcaId\`),
          CONSTRAINT \`Modelo_marcaId_fkey\` FOREIGN KEY (\`marcaId\`) REFERENCES \`Marca\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Tabla Modelo creada\n");
    } else {
      console.log("ℹ️  Tabla Modelo ya existe, continuando...\n");
    }

    // PASO 2: Verificar si modeloId existe en TelefonoSeminuevo
    const columnsResult = await connection.query(
      "SHOW COLUMNS FROM TelefonoSeminuevo LIKE 'modeloId'"
    ) as any[];
    
    const columns = Array.isArray(columnsResult) ? columnsResult : [];

    if (columns.length === 0) {
      console.log("📦 Paso 2: Agregando columna modeloId a TelefonoSeminuevo...");
      await connection.query(`
        ALTER TABLE \`TelefonoSeminuevo\` 
        ADD COLUMN \`modeloId\` INT NULL,
        ADD INDEX \`TelefonoSeminuevo_modeloId_idx\` (\`modeloId\`)
      `);
      console.log("✅ Columna modeloId agregada\n");
    } else {
      console.log("ℹ️  Columna modeloId ya existe, continuando...\n");
    }

    // PASO 3: Verificar si existe columna modelo en TelefonoSeminuevo
    const modeloColumnResult = await connection.query(
      "SHOW COLUMNS FROM TelefonoSeminuevo LIKE 'modelo'"
    ) as any[];
    
    const modeloColumn = Array.isArray(modeloColumnResult) ? modeloColumnResult : [];

    if (modeloColumn.length === 0) {
      console.log("ℹ️  Columna 'modelo' no existe en TelefonoSeminuevo, saltando migración de datos\n");
    } else {
      // Migrar datos de TelefonoSeminuevo.modelo a Modelo
      console.log("📦 Paso 3: Migrando datos de modelos...");
      const telefonosResult = await connection.query(`
        SELECT DISTINCT marcaId, modelo 
        FROM TelefonoSeminuevo 
        WHERE modelo IS NOT NULL AND modelo != ''
      `) as any;
      
      const telefonos = Array.isArray(telefonosResult) ? telefonosResult : [];

      let modelosCreados = 0;
      for (const telefono of telefonos) {
        try {
          await connection.query(`
            INSERT INTO Modelo (marcaId, nombre, createdAt, updatedAt)
            VALUES (?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE nombre = nombre
          `, [telefono.marcaId, telefono.modelo]);
          modelosCreados++;
        } catch (error: any) {
          if (!error.message.includes("Duplicate entry")) {
            console.error(`Error al crear modelo ${telefono.modelo}:`, error.message);
          }
        }
      }
      console.log(`✅ ${modelosCreados} modelos creados/migrados\n`);

      // PASO 4: Asignar modeloId a los teléfonos seminuevos
      console.log("📦 Paso 4: Asignando modeloId a teléfonos seminuevos...");
      const updatedResult = await connection.query(`
        UPDATE TelefonoSeminuevo ts
        INNER JOIN Modelo m ON m.marcaId = ts.marcaId AND m.nombre = ts.modelo
        SET ts.modeloId = m.id
        WHERE ts.modelo IS NOT NULL AND ts.modelo != '' AND ts.modeloId IS NULL
      `) as any;
      
      const affectedRows = updatedResult?.affectedRows || updatedResult?.[0]?.affectedRows || 0;
      console.log(`✅ ${affectedRows} teléfonos seminuevos actualizados\n`);
    }

    // PASO 5: Agregar foreign key si no existe
    console.log("📦 Paso 5: Verificando foreign key constraint...");
    const fksResult = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'TelefonoSeminuevo' 
      AND CONSTRAINT_NAME = 'TelefonoSeminuevo_modeloId_fkey'
    `, [database]) as any[];
    
    const fks = Array.isArray(fksResult) ? fksResult : [];

    if (fks.length === 0) {
      await connection.query(`
        ALTER TABLE TelefonoSeminuevo
        ADD CONSTRAINT TelefonoSeminuevo_modeloId_fkey 
        FOREIGN KEY (modeloId) REFERENCES Modelo (id) ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      console.log("✅ Foreign key agregada\n");
    } else {
      console.log("ℹ️  Foreign key ya existe, continuando...\n");
    }

    // PASO 6: Migrar imágenes a Modelo
    console.log("📦 Paso 6: Verificando columna modeloId en ImagenProducto...");
    const imgColumnsResult = await connection.query(
      "SHOW COLUMNS FROM ImagenProducto LIKE 'modeloId'"
    ) as any[];
    
    const imgColumns = Array.isArray(imgColumnsResult) ? imgColumnsResult : [];

    if (imgColumns.length === 0) {
      await connection.query(`
        ALTER TABLE ImagenProducto 
        ADD COLUMN modeloId INT NULL,
        ADD INDEX ImagenProducto_modeloId_idx (modeloId)
      `);
      console.log("✅ Columna modeloId agregada a ImagenProducto\n");
    }

    // Migrar imágenes de telefonoSeminuevoId a modeloId (si existe la columna)
    const telefonoSeminuevoIdColResult = await connection.query(
      "SHOW COLUMNS FROM ImagenProducto LIKE 'telefonoSeminuevoId'"
    ) as any[];
    
    const telefonoSeminuevoIdCol = Array.isArray(telefonoSeminuevoIdColResult) ? telefonoSeminuevoIdColResult : [];

    if (telefonoSeminuevoIdCol.length > 0) {
      console.log("📦 Migrando imágenes de TelefonoSeminuevo a Modelo...");
      const imgUpdatedResult = await connection.query(`
        UPDATE ImagenProducto ip
        INNER JOIN TelefonoSeminuevo ts ON ip.telefonoSeminuevoId = ts.id
        SET ip.modeloId = ts.modeloId
        WHERE ip.telefonoSeminuevoId IS NOT NULL 
        AND ts.modeloId IS NOT NULL 
        AND ip.modeloId IS NULL
      `) as any;
      
      const imgAffectedRows = imgUpdatedResult?.affectedRows || imgUpdatedResult?.[0]?.affectedRows || 0;
      console.log(`✅ ${imgAffectedRows} imágenes migradas\n`);
    }

    // Agregar foreign key para modeloId en ImagenProducto
    const imgFksResult = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'ImagenProducto' 
      AND CONSTRAINT_NAME = 'ImagenProducto_modeloId_fkey'
    `, [database]) as any[];
    
    const imgFks = Array.isArray(imgFksResult) ? imgFksResult : [];

    if (imgFks.length === 0) {
      await connection.query(`
        ALTER TABLE ImagenProducto
        ADD CONSTRAINT ImagenProducto_modeloId_fkey 
        FOREIGN KEY (modeloId) REFERENCES Modelo (id) ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log("✅ Foreign key para imágenes agregada\n");
    }

    console.log("✅ Migración completada exitosamente!");
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Verifica que los datos se migraron correctamente");
    console.log("   2. Ejecuta: npx prisma generate");
    console.log("   3. Ejecuta: npx prisma db push");
    console.log("   4. (Opcional) Elimina las columnas antiguas manualmente cuando estés seguro");

  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log("\n✅ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
