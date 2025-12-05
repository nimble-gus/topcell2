import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener todas las cuentas bancarias activas (público)
export async function GET() {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: {
        activo: true,
      },
      orderBy: [
        { orden: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(cuentas);
  } catch (error: any) {
    console.error("Error al obtener cuentas bancarias:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener las cuentas bancarias" },
      { status: 500 }
    );
  }
}
