import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      telefono,
      direccion,
      nombreEmpresa,
      departamento,
      municipio,
    } = body;

    // Validar campos requeridos
    if (!nombre || !telefono || !direccion || !nombreEmpresa || !departamento || !municipio) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const solicitud = await prisma.solicitudMayorista.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        nombreEmpresa: nombreEmpresa.trim(),
        departamento: departamento.trim(),
        municipio: municipio.trim(),
        status: "Nuevo",
      },
    });

    return NextResponse.json(
      { message: "Solicitud enviada correctamente", solicitud },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear solicitud de mayorista:", error);
    return NextResponse.json(
      { error: "Error al enviar la solicitud" },
      { status: 500 }
    );
  }
}

