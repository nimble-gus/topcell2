"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Localidad {
  id: number;
  imagenUrl: string;
  titulo: string;
  direccion: string;
  telefono: string | null;
  linkGoogleMaps: string | null;
  linkWaze: string | null;
  activo: boolean;
  orden: number;
}

export default function LocalidadesPage() {
  const router = useRouter();
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalidades();
  }, []);

  const loadLocalidades = async () => {
    try {
      const response = await fetch("/api/admin/localidades");
      if (response.ok) {
        const data = await response.json();
        setLocalidades(data);
      }
    } catch (error) {
      console.error("Error al cargar localidades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta localidad?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/localidades/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadLocalidades();
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar localidad");
      }
    } catch (error) {
      console.error("Error al eliminar localidad:", error);
      alert("Error al eliminar localidad");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando localidades...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestionar Ubicaciones</h1>
        <Link
          href="/admin/ubicaciones/nueva"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nueva Localidad
        </Link>
      </div>

      {localidades.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No hay localidades registradas</p>
          <Link
            href="/admin/ubicaciones/nueva"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Crear primera localidad
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localidades.map((localidad) => (
            <div
              key={localidad.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="relative w-full h-48 bg-gray-100">
                <img
                  src={localidad.imagenUrl}
                  alt={localidad.titulo}
                  className="w-full h-full object-cover"
                />
                {!localidad.activo && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Inactivo
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{localidad.titulo}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{localidad.direccion}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/ubicaciones/${localidad.id}`}
                    className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(localidad.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

