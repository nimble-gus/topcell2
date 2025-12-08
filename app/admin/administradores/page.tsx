"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Administrador {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  permisos: any;
  activo: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export default function AdministradoresPage() {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activoFilter, setActivoFilter] = useState<string>("");

  useEffect(() => {
    fetchAdministradores();
  }, [search, activoFilter]);

  const fetchAdministradores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (activoFilter !== "") params.append("activo", activoFilter);

      const response = await fetch(`/api/admin/administradores?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 403) {
          alert("No tienes permisos para ver esta sección");
          return;
        }
        throw new Error("Error al cargar administradores");
      }

      const data = await response.json();
      setAdministradores(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: number, currentActivo: boolean) => {
    try {
      const response = await fetch(`/api/admin/administradores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActivo }),
      });

      if (!response.ok) throw new Error("Error al actualizar administrador");

      fetchAdministradores();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el estado del administrador");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas desactivar este administrador?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/administradores/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar administrador");

      fetchAdministradores();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el administrador");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Administradores</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administra los usuarios del panel de administración
          </p>
        </div>
        <Link
          href="/admin/administradores/nuevo"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nuevo Administrador
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar (nombre, email)
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar administrador..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="activo" className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              id="activo"
              value={activoFilter}
              onChange={(e) => setActivoFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de administradores */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Cargando administradores...</p>
        </div>
      ) : administradores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No se encontraron administradores</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Administrador
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Rol
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Permisos
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                  Último Acceso
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Estado
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {administradores.map((admin) => {
                const fechaCreacion = new Date(admin.createdAt).toLocaleDateString("es-GT", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const ultimoAcceso = admin.lastLogin
                  ? new Date(admin.lastLogin).toLocaleDateString("es-GT", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Nunca";

                // Contar permisos activos
                const permisosCount =
                  admin.permisos && typeof admin.permisos === "object"
                    ? Object.values(admin.permisos).filter((v) => v === true).length
                    : 0;

                return (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{admin.nombre}</div>
                        <div className="text-xs text-gray-500 truncate">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          admin.rol === "superadmin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {admin.rol === "superadmin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {admin.rol === "superadmin" ? (
                        <span className="text-green-600 font-semibold">Todos los permisos</span>
                      ) : permisosCount > 0 ? (
                        `${permisosCount} sección${permisosCount > 1 ? "es" : ""}`
                      ) : (
                        "Sin permisos"
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{ultimoAcceso}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleToggleActivo(admin.id, admin.activo)}
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          admin.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {admin.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium space-x-2">
                      <Link
                        href={`/admin/administradores/${admin.id}`}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        Editar
                      </Link>
                      {admin.rol !== "superadmin" && (
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="text-red-600 hover:text-red-900 hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
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

