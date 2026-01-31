import "server-only";
import { prisma } from "@/lib/prisma";

const CLAVE_SYSTEMS_TRACE_NO = "neopay_systemsTraceNo";
const MAX_VALUE = 999999;
const MIN_VALUE = 1;

/**
 * Obtiene el siguiente SystemsTraceNo correlativo cíclico (000001 a 999999).
 * Por cada petición de venta se incrementa en uno.
 * Al llegar a 999999 reinicia en 000001.
 */
export async function getNextSystemsTraceNo(): Promise<string> {
  const result = await prisma.$transaction(async (tx) => {
    const config = await tx.configuracionSistema.findUnique({
      where: { clave: CLAVE_SYSTEMS_TRACE_NO },
    });

    const currentStored = config ? parseInt(config.valor, 10) : 0;
    const valueToUse = currentStored >= MAX_VALUE ? MIN_VALUE : (currentStored || MIN_VALUE);
    const nextStored = valueToUse >= MAX_VALUE ? MIN_VALUE : valueToUse + 1;

    if (!config) {
      await tx.configuracionSistema.create({
        data: {
          clave: CLAVE_SYSTEMS_TRACE_NO,
          valor: String(nextStored),
        },
      });
    } else {
      await tx.configuracionSistema.update({
        where: { clave: CLAVE_SYSTEMS_TRACE_NO },
        data: { valor: String(nextStored) },
      });
    }

    return valueToUse;
  });

  return result.toString().padStart(6, "0");
}
