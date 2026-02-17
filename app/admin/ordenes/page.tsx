import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OrdenesTable from "./OrdenesTable";

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; fechaDesde?: string; fechaHasta?: string; cliente?: string }>;
}) {
  const params = await searchParams;
  const estado = params.estado;
  const fechaDesde = params.fechaDesde;
  const fechaHasta = params.fechaHasta;
  const cliente = params.cliente;

  const where: any = {};

  if (estado) {
    where.estado = estado;
  }

  if (fechaDesde || fechaHasta) {
    where.createdAt = {};
    if (fechaDesde) {
      where.createdAt.gte = new Date(fechaDesde);
    }
    if (fechaHasta) {
      const fechaHastaDate = new Date(fechaHasta);
      fechaHastaDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = fechaHastaDate;
    }
  }

  if (cliente) {
    where.usuario = {
      OR: [
        { nombre: { contains: cliente } },
        { email: { contains: cliente } },
      ],
    };
  }

  const ordenesRaw = await prisma.orden.findMany({
    where,
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
        },
      },
      items: {
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serializar para el Client Component: Prisma Decimal no es serializable
  const ordenes = ordenesRaw.map((o) => ({
    id: o.id,
    numeroOrden: o.numeroOrden,
    estado: o.estado,
    tipoEnvio: o.tipoEnvio,
    metodoPago: o.metodoPago,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    usuario: o.usuario,
  }));

  const estados = ["PENDIENTE", "PROCESANDO", "ENVIADO", "ENTREGADO", "CANCELADO"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <p className="mt-2 text-sm text-gray-600">
          Administra y rastrea todas las órdenes de la tienda
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow p-4">
        <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado || ""}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              id="fechaDesde"
              name="fechaDesde"
              defaultValue={fechaDesde || ""}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              id="fechaHasta"
              name="fechaHasta"
              defaultValue={fechaHasta || ""}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
              Cliente (nombre/email)
            </label>
            <input
              type="text"
              id="cliente"
              name="cliente"
              defaultValue={cliente || ""}
              placeholder="Buscar cliente..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Filtrar
            </button>
            <Link
              href="/admin/ordenes"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar
            </Link>
          </div>
        </form>
      </div>

      {/* Tabla de órdenes */}
      {ordenes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No se encontraron órdenes</p>
        </div>
      ) : (
        <OrdenesTable ordenes={ordenes} />
      )}
    </div>
  );
}

