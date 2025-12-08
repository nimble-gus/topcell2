import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  const ordenes = await prisma.orden.findMany({
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
        take: 1, // Solo para contar items
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const estados = ["PENDIENTE", "PROCESANDO", "ENVIADO", "ENTREGADO", "CANCELADO"];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESANDO":
        return "bg-blue-100 text-blue-800";
      case "ENVIADO":
        return "bg-purple-100 text-purple-800";
      case "ENTREGADO":
        return "bg-green-100 text-green-800";
      case "CANCELADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[160px]">
                  Orden
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Estado
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Envío
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                  Pago
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                  Total
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                  Acc
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenes.map((orden) => {
                const fechaOrden = new Date(orden.createdAt).toLocaleDateString("es-GT", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                
                return (
                  <tr key={orden.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs font-medium text-gray-900">
                      <div className="truncate" title={orden.numeroOrden}>{orden.numeroOrden}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900 truncate">
                          {orden.usuario.nombre} {orden.usuario.apellido || ""}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{orden.usuario.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {fechaOrden}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getEstadoColor(
                          orden.estado
                        )}`}
                      >
                        {orden.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {orden.tipoEnvio === "ENVIO" ? "Envío" : "Bodega"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {orden.metodoPago === "CONTRA_ENTREGA" 
                        ? "Contra Entrega" 
                        : orden.metodoPago === "TARJETA"
                        ? "Pago con Tarjeta"
                        : "Transferencia"}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                      Q{Number(orden.total).toLocaleString("es-GT")}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium">
                      <Link
                        href={`/admin/ordenes/${orden.id}`}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        title="Ver Detalles"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

