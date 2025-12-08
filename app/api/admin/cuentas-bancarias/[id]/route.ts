import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Obtener una cuenta bancaria específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cuentaId = parseInt(id);

    if (isNaN(cuentaId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId },
    });

    if (!cuenta) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(cuenta);
  } catch (error: any) {
    console.error("Error al obtener cuenta bancaria:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener la cuenta bancaria" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar cuenta bancaria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cuentaId = parseInt(id);

    if (isNaN(cuentaId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
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

    const cuenta = await prisma.cuentaBancaria.update({
      where: { id: cuentaId },
      data: {
        banco: banco.trim(),
        numeroCuenta: numeroCuenta.trim(),
        tipoCuenta: tipoCuenta.trim(),
        nombreTitular: nombreTitular.trim(),
        activo: activo !== undefined ? activo : true,
        orden: orden !== undefined ? orden : 0,
      },
    });

    return NextResponse.json(cuenta);
  } catch (error: any) {
    console.error("Error al actualizar cuenta bancaria:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la cuenta bancaria" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar cuenta bancaria (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cuentaId = parseInt(id);

    if (isNaN(cuentaId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Soft delete: marcar como inactivo
    const cuenta = await prisma.cuentaBancaria.update({
      where: { id: cuentaId },
      data: {
        activo: false,
      },
    });

    return NextResponse.json({ success: true, cuenta });
  } catch (error: any) {
    console.error("Error al eliminar cuenta bancaria:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la cuenta bancaria" },
      { status: 500 }
    );
  }
}
