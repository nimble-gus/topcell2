import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, notas } = body;

    // Validar status
    const statusValidos = ["Nuevo", "Pendiente", "Contactado"];
    if (status && !statusValidos.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Debe ser uno de: ${statusValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const solicitud = await prisma.solicitudMayorista.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notas !== undefined && { notas }),
      },
    });

    return NextResponse.json(solicitud);
  } catch (error: any) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json(
      { error: "Error al actualizar solicitud" },
      { status: 500 }
    );
  }
}

