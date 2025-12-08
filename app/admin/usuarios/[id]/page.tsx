"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  ordenes: Array<{
    id: number;
    numeroOrden: string;
    estado: string;
    total: number;
    createdAt: string;
  }>;
  _count: {
    ordenes: number;
  };
}

export default function UsuarioDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUsuario();
    }
  }, [id]);

  const fetchUsuario = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/usuarios/${id}`);
      if (!response.ok) throw new Error("Error al cargar usuario");

      const data = await response.json();
      setUsuario(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Usuario no encontrado</p>
          <Link href="/admin/usuarios" className="text-indigo-600 hover:underline mt-4 inline-block">
            Volver a Usuarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/usuarios"
          className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block"
        >
          ← Volver a Usuarios
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {usuario.nombre} {usuario.apellido || ""}
        </h1>
        <p className="mt-2 text-sm text-gray-600">Detalles del usuario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información del Usuario */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{usuario.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900">{usuario.telefono || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Dirección</dt>
              <dd className="mt-1 text-sm text-gray-900">{usuario.direccion || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
              <dd className="mt-1 text-sm text-gray-900">{usuario.ciudad || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Código Postal</dt>
              <dd className="mt-1 text-sm text-gray-900">{usuario.codigoPostal || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    usuario.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {usuario.activo ? "Activo" : "Inactivo"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Registro</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(usuario.createdAt).toLocaleDateString("es-GT", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Historial de Órdenes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Historial de Órdenes ({usuario._count.ordenes})
          </h2>
          {usuario.ordenes.length === 0 ? (
            <p className="text-sm text-gray-500">Este usuario no tiene órdenes</p>
          ) : (
            <div className="space-y-3">
              {usuario.ordenes.map((orden) => (
                <Link
                  key={orden.id}
                  href={`/admin/ordenes/${orden.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{orden.numeroOrden}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(orden.createdAt).toLocaleDateString("es-GT")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        Q{Number(orden.total).toLocaleString("es-GT")}
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${
                          orden.estado === "PENDIENTE"
                            ? "bg-yellow-100 text-yellow-800"
                            : orden.estado === "ENTREGADO"
                            ? "bg-green-100 text-green-800"
                            : orden.estado === "CANCELADO"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {orden.estado}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {usuario._count.ordenes > usuario.ordenes.length && (
                <Link
                  href={`/admin/ordenes?cliente=${usuario.email}`}
                  className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
                >
                  Ver todas las órdenes →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

