/**
 * Utilidades para manejar productos y su stock
 */

import { prisma } from "./prisma";

/**
 * Recalcula y actualiza el stock total de un teléfono nuevo
 * basado en el stock de sus variantes (color + ROM)
 */
export async function updateTelefonoNuevoStock(telefonoId: number) {
  const variantes = await prisma.telefonoNuevoVariante.findMany({
    where: { telefonoNuevoId: telefonoId },
  });

  const stockTotal = variantes.reduce((sum, v) => sum + v.stock, 0);

  await prisma.telefonoNuevo.update({
    where: { id: telefonoId },
    data: { stock: stockTotal },
  });

  return stockTotal;
}

/**
 * Recalcula y actualiza el stock total de un teléfono seminuevo
 * basado en el stock de sus variantes (color + ROM)
 */
export async function updateTelefonoSeminuevoStock(telefonoId: number) {
  const variantes = await prisma.telefonoSeminuevoVariante.findMany({
    where: { telefonoSeminuevoId: telefonoId },
  });

  const stockTotal = variantes.reduce((sum, v) => sum + v.stock, 0);

  await prisma.telefonoSeminuevo.update({
    where: { id: telefonoId },
    data: { stock: stockTotal },
  });

  return stockTotal;
}

/**
 * Recalcula y actualiza el stock total de un accesorio
 */
export async function updateAccesorioStock(accesorioId: number) {
  const colores = await prisma.accesorioColor.findMany({
    where: { accesorioId },
  });

  const stockTotal = colores.reduce((sum, c) => sum + c.stock, 0);

  await prisma.accesorio.update({
    where: { id: accesorioId },
    data: { stock: stockTotal },
  });

  return stockTotal;
}

