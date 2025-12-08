"use client";

import { useEffect, useState } from "react";
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

export default function MayoristasPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [solicitudesRes, videoRes] = await Promise.all([
        fetch("/api/admin/mayoristas/solicitudes"),
        fetch("/api/admin/mayoristas/video"),
      ]);

      if (solicitudesRes.ok) {
        const data = await solicitudesRes.json();
        setSolicitudes(data);
      }

      if (videoRes.ok) {
        const data = await videoRes.json();
        setVideoUrl(data.url || "");
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSave = async () => {
    setLoadingVideo(true);
    try {
      const response = await fetch("/api/admin/mayoristas/video", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (response.ok) {
        alert("Video actualizado correctamente");
      } else {
        const data = await response.json();
        alert(data.error || "Error al actualizar el video");
      }
    } catch (error) {
      console.error("Error al guardar video:", error);
      alert("Error al guardar el video");
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/mayoristas/solicitudes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadData();
      } else {
        const data = await response.json();
        alert(data.error || "Error al actualizar el status");
      }
    } catch (error) {
      console.error("Error al actualizar status:", error);
      alert("Error al actualizar el status");
    }
  };

  const handleExport = () => {
    window.open("/api/admin/mayoristas/solicitudes/export", "_blank");
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestionar Mayoristas</h1>

      {/* Configuración del Video */}
      <div className="bg-white rounded-lg border border-gray-200 shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Video de YouTube
        </h2>
        <div className="flex gap-4">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={handleVideoSave}
            disabled={loadingVideo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loadingVideo ? "Guardando..." : "Guardar"}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Ingresa la URL completa del video de YouTube
        </p>
      </div>

      {/* Lista de Solicitudes */}
      <div className="bg-white rounded-lg border border-gray-200 shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Solicitudes de Mayoristas ({solicitudes.length})
          </h2>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            📥 Exportar a Excel
          </button>
        </div>

        {solicitudes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No hay solicitudes registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(solicitud.createdAt).toLocaleDateString("es-GT")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {solicitud.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitud.nombreEmpresa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitud.telefono}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {solicitud.municipio}, {solicitud.departamento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={solicitud.status}
                        onChange={(e) => handleStatusChange(solicitud.id, e.target.value)}
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${getStatusColor(solicitud.status)} border-0`}
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Contactado">Contactado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/mayoristas/solicitudes/${solicitud.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

