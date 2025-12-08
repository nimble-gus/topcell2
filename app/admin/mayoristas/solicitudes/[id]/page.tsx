"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Solicitud {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  nombreEmpresa: string;
  departamento: string;
  municipio: string;
  status: string;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DetalleSolicitudPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [status, setStatus] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    loadSolicitud();
  }, [id]);

  const loadSolicitud = async () => {
    try {
      const response = await fetch(`/api/admin/mayoristas/solicitudes`);
      if (!response.ok) {
        throw new Error("Error al cargar solicitudes");
      }
      const solicitudes = await response.json();
      const solicitudEncontrada = solicitudes.find((s: Solicitud) => s.id === parseInt(id));
      
      if (!solicitudEncontrada) {
        throw new Error("Solicitud no encontrada");
      }
      
      setSolicitud(solicitudEncontrada);
      setStatus(solicitudEncontrada.status);
      setNotas(solicitudEncontrada.notas || "");
    } catch (error) {
      console.error("Error al cargar solicitud:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/mayoristas/solicitudes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notas }),
      });

      if (response.ok) {
        router.push("/admin/mayoristas");
      } else {
        const data = await response.json();
        alert(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="p-6">
        <p>Solicitud no encontrada</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Nuevo":
        return "bg-blue-100 text-blue-800";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "Contactado":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/mayoristas"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Volver a Mayoristas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Detalle de Solicitud</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del solicitante */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información del Solicitante
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">{solicitud.nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Teléfono</label>
              <p className="mt-1 text-sm text-gray-900">{solicitud.telefono}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Dirección</label>
              <p className="mt-1 text-sm text-gray-900">{solicitud.direccion}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Empresa</label>
              <p className="mt-1 text-sm text-gray-900">{solicitud.nombreEmpresa}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Ubicación</label>
              <p className="mt-1 text-sm text-gray-900">
                {solicitud.municipio}, {solicitud.departamento}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Fecha de Solicitud</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(solicitud.createdAt).toLocaleString("es-GT")}
              </p>
            </div>
          </div>
        </div>

        {/* Gestión */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestión</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full rounded-md px-3 py-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${getStatusColor(status)}`}
              >
                <option value="Nuevo">Nuevo</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Contactado">Contactado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={6}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Agregar notas sobre esta solicitud..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

