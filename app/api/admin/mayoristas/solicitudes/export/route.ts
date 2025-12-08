import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const solicitudes = await prisma.solicitudMayorista.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convertir a CSV (formato compatible con Excel)
    const headers = [
      "ID",
      "Nombre",
      "Teléfono",
      "Dirección",
      "Nombre de Empresa",
      "Departamento",
      "Municipio",
      "Status",
      "Notas",
      "Fecha de Creación",
      "Última Actualización",
    ];

    const rows = solicitudes.map((s) => [
      s.id.toString(),
      s.nombre,
      s.telefono,
      s.direccion,
      s.nombreEmpresa,
      s.departamento,
      s.municipio,
      s.status,
      s.notas || "",
      s.createdAt.toISOString(),
      s.updatedAt.toISOString(),
    ]);

    // Crear CSV con BOM para Excel (UTF-8)
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Agregar BOM para Excel
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    return new NextResponse(csvWithBOM, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="solicitudes-mayoristas-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error al exportar solicitudes:", error);
    return NextResponse.json(
      { error: "Error al exportar solicitudes" },
      { status: 500 }
    );
  }
}

