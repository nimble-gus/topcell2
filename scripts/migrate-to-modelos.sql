-- Script de migración para crear tabla Modelo y migrar datos existentes
-- Ejecutar paso a paso

-- PASO 1: Crear la tabla Modelo
CREATE TABLE IF NOT EXISTS `Modelo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `marcaId` INT NOT NULL,
  `nombre` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Modelo_marcaId_nombre_key` (`marcaId`, `nombre`),
  INDEX `Modelo_marcaId_idx` (`marcaId`),
  CONSTRAINT `Modelo_marcaId_fkey` FOREIGN KEY (`marcaId`) REFERENCES `Marca` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PASO 2: Crear columna modeloId en TelefonoSeminuevo como opcional
ALTER TABLE `TelefonoSeminuevo` 
ADD COLUMN `modeloId` INT NULL,
ADD INDEX `TelefonoSeminuevo_modeloId_idx` (`modeloId`);

-- PASO 3: Migrar datos existentes de TelefonoSeminuevo.modelo a la tabla Modelo
-- Esto crea un modelo por cada combinación única de marcaId + modelo
INSERT INTO `Modelo` (`marcaId`, `nombre`, `createdAt`, `updatedAt`)
SELECT DISTINCT 
  ts.`marcaId`,
  ts.`modelo` as `nombre`,
  NOW() as `createdAt`,
  NOW() as `updatedAt`
FROM `TelefonoSeminuevo` ts
WHERE ts.`modelo` IS NOT NULL AND ts.`modelo` != ''
ON DUPLICATE KEY UPDATE `nombre` = `nombre`;

-- PASO 4: Asignar modeloId a los teléfonos seminuevos existentes
UPDATE `TelefonoSeminuevo` ts
INNER JOIN `Modelo` m ON m.`marcaId` = ts.`marcaId` AND m.`nombre` = ts.`modelo`
SET ts.`modeloId` = m.`id`
WHERE ts.`modelo` IS NOT NULL AND ts.`modelo` != '';

-- PASO 5: Agregar foreign key constraint
ALTER TABLE `TelefonoSeminuevo`
ADD CONSTRAINT `TelefonoSeminuevo_modeloId_fkey` 
FOREIGN KEY (`modeloId`) REFERENCES `Modelo` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- PASO 6: Migrar imágenes de TelefonoSeminuevo a Modelo
-- Primero agregar columna modeloId a ImagenProducto si no existe
ALTER TABLE `ImagenProducto` 
ADD COLUMN `modeloId` INT NULL,
ADD INDEX `ImagenProducto_modeloId_idx` (`modeloId`);

-- Migrar imágenes de telefonoSeminuevoId a modeloId
-- Esto asigna las imágenes del teléfono seminuevo al modelo correspondiente
UPDATE `ImagenProducto` ip
INNER JOIN `TelefonoSeminuevo` ts ON ip.`telefonoSeminuevoId` = ts.`id`
SET ip.`modeloId` = ts.`modeloId`
WHERE ip.`telefonoSeminuevoId` IS NOT NULL AND ts.`modeloId` IS NOT NULL;

-- Agregar foreign key para modeloId en ImagenProducto
ALTER TABLE `ImagenProducto`
ADD CONSTRAINT `ImagenProducto_modeloId_fkey` 
FOREIGN KEY (`modeloId`) REFERENCES `Modelo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTA: Las columnas antiguas (TelefonoSeminuevo.modelo e ImagenProducto.telefonoSeminuevoId)
-- se pueden eliminar después de verificar que todo funciona correctamente
-- Ejecutar manualmente cuando estés seguro:
-- ALTER TABLE `TelefonoSeminuevo` DROP COLUMN `modelo`;
-- ALTER TABLE `ImagenProducto` DROP COLUMN `telefonoSeminuevoId`;
