-- Crear tabla ConfiguracionSistema para el contador de SystemsTraceNo
-- Ejecutar manualmente si prisma db push no está disponible

CREATE TABLE IF NOT EXISTS `ConfiguracionSistema` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConfiguracionSistema_clave_key`(`clave`),
    INDEX `ConfiguracionSistema_clave_idx`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
