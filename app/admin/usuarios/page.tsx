"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  activo: boolean;
  createdAt: string;
  _count: {
    ordenes: number;
  };
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activoFilter, setActivoFilter] = useState<string>("");

  useEffect(() => {
    fetchUsuarios();
  }, [search, activoFilter]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (activoFilter !== "") params.append("activo", activoFilter);

      const response = await fetch(`/api/admin/usuarios?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: number, currentActivo: boolean) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActivo }),
      });

      if (!response.ok) throw new Error("Error al actualizar usuario");

      fetchUsuarios();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el estado del usuario");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="mt-2 text-sm text-gray-600">
          Administra los usuarios registrados en la tienda
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar (nombre, email, teléfono)
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
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

      {/* Tabla de usuarios */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Usuario
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Contacto
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Dirección
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Órdenes
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Estado
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Fecha
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                  Acc
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => {
                const fechaRegistro = new Date(usuario.createdAt).toLocaleDateString("es-GT", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {usuario.nombre} {usuario.apellido || ""}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{usuario.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {usuario.telefono || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      <div className="truncate" title={usuario.direccion || ""}>
                        {usuario.direccion || "—"}
                      </div>
                      {usuario.ciudad && (
                        <div className="text-xs text-gray-400">{usuario.ciudad}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {usuario._count.ordenes}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleToggleActivo(usuario.id, usuario.activo)}
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          usuario.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {fechaRegistro}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium">
                      <Link
                        href={`/admin/usuarios/${usuario.id}`}
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

