import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Obtener todas las cuentas bancarias (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const cuentas = await prisma.cuentaBancaria.findMany({
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

// POST: Crear nueva cuenta bancaria
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { banco, numeroCuenta, tipoCuenta, nombreTitular, activo, orden } = body;

    if (!banco || !numeroCuenta || !tipoCuenta || !nombreTitular) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const cuenta = await prisma.cuentaBancaria.create({
      data: {
        banco: banco.trim(),
        numeroCuenta: numeroCuenta.trim(),
        tipoCuenta: tipoCuenta.trim(),
        nombreTitular: nombreTitular.trim(),
        activo: activo !== undefined ? activo : true,
        orden: orden !== undefined ? orden : 0,
      },
    });

    return NextResponse.json(cuenta, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear cuenta bancaria:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear la cuenta bancaria" },
      { status: 500 }
    );
  }
}
