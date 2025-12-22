"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditarColorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nombreColor, setNombreColor] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/admin/colores/${id}`);

        if (!response.ok) {
          throw new Error("Color no encontrado");
        }

        const colorData = await response.json();
        setNombreColor(colorData.color);
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/colores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          color: nombreColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el color");
      }

      router.push("/admin/catalogo/colores");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalogo/colores"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a colores
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Editar Color</h1>
        <p className="mt-2 text-sm text-gray-600">Modifica el nombre del color</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border-2 border-red-300 p-4">
          <p className="text-sm font-bold text-red-950">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Información del Color
            </h2>
          </div>
          <div className="px-6 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre del Color *
              </label>
              <input
                type="text"
                required
                value={nombreColor}
                onChange={(e) => setNombreColor(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Ej: Negro, Blanco, Azul, Rojo"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/catalogo/colores"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

