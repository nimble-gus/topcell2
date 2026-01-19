"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";

export default function NuevoModeloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);

  useEffect(() => {
    async function loadMarcas() {
      try {
        const response = await fetch("/api/admin/marcas");
        const data = await response.json();
        setMarcas(data);
      } catch (error) {
        console.error("Error al cargar marcas:", error);
      }
    }
    loadMarcas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!marcaId || !nombre.trim()) {
        throw new Error("La marca y el nombre del modelo son requeridos");
      }

      const response = await fetch("/api/admin/modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marcaId,
          nombre: nombre.trim(),
          imagenes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el modelo");
      }

      router.push("/admin/catalogo/modelos");
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
          href="/admin/catalogo/modelos"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a modelos
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Nuevo Modelo</h1>
        <p className="mt-2 text-sm text-gray-600">
          Agrega un nuevo modelo de teléfono (ej: iPhone 14, Galaxy S24)
        </p>
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
              Información del Modelo
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Marca *
              </label>
              <select
                required
                value={marcaId}
                onChange={(e) => setMarcaId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Seleccionar marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre del Modelo *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Ej: iPhone 14, Galaxy S24, Pixel 8"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Imágenes de Catálogo
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Sube las imágenes oficiales del modelo (fotos de catálogo)
            </p>
          </div>
          <div className="px-6 py-4">
            <ImageUploader
              images={imagenes}
              onImagesChange={setImagenes}
              maxImages={10}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/catalogo/modelos"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Modelo"}
          </button>
        </div>
      </form>
    </div>
  );
}
