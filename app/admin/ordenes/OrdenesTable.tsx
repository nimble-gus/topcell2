"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrdenRow = {
  id: number;
  numeroOrden: string;
  estado: string;
  tipoEnvio: string;
  metodoPago: string;
  total: number | string;
  createdAt: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string | null;
    email: string;
    telefono: string | null;
  };
};

function getEstadoColor(estado: string) {
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
}

export default function OrdenesTable({ ordenes }: { ordenes: OrdenRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === ordenes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ordenes.map((o) => o.id)));
    }
  };

  const handleDeleteOne = async (id: number, numeroOrden: string) => {
    if (!confirm(`¿Eliminar la orden ${numeroOrden}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/ordenes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar");
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Error al eliminar la orden");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} orden(es) seleccionada(s)? Esta acción no se puede deshacer.`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/ordenes/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar");
      }
      setSelectedIds(new Set());
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Error al eliminar las órdenes");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-700">
            {selectedIds.size} seleccionada(s)
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {bulkDeleting ? "Eliminando…" : "Eliminar seleccionadas"}
          </button>
        </div>
      )}
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left w-10">
              <input
                type="checkbox"
                checked={ordenes.length > 0 && selectedIds.size === ordenes.length}
                onChange={toggleAll}
                className="rounded border-gray-300"
              />
            </th>
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
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
              Acciones
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
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(orden.id)}
                    onChange={() => toggleOne(orden.id)}
                    className="rounded border-gray-300"
                  />
                </td>
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
                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}
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
                <td className="px-3 py-2 text-right text-xs font-medium space-x-2">
                  <Link
                    href={`/admin/ordenes/${orden.id}`}
                    className="text-indigo-600 hover:text-indigo-900 hover:underline"
                    title="Editar"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteOne(orden.id, orden.numeroOrden)}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
