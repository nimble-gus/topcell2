"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevoColorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [color, setColor] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/colores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el color");
      }

      router.push("/admin/catalogo/colores");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalogo/colores"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a colores
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Nuevo Color</h1>
        <p className="mt-2 text-sm text-gray-600">Agrega un nuevo color</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border-2 border-red-300 p-4">
          <p className="text-sm font-bold text-red-950">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del Color *
            </label>
            <input
              type="text"
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ej: Negro, Blanco, Azul, Rojo"
            />
          </div>
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/catalogo/colores"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Color"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

