"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SingleImageUploader from "@/components/admin/SingleImageUploader";

export default function NuevaCTAPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [urlDestino, setUrlDestino] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState(0);
  const [activo, setActivo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!imageUrl) {
      setError("Debes subir una imagen");
      setSaving(false);
      return;
    }

    if (!urlDestino.trim()) {
      setError("Debes especificar una URL de destino");
      setSaving(false);
      return;
    }

    // Validar que la URL sea válida
    try {
      new URL(urlDestino);
    } catch {
      setError("La URL de destino no es válida");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/contenido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "cta",
          url: imageUrl,
          urlDestino: urlDestino.trim(),
          descripcion: descripcion.trim() || null,
          activo,
          orden,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar la imagen");
      }

      router.push("/admin/contenido/cta");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/contenido/cta"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a imágenes CTA
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Nueva Imagen Publicitaria CTA</h1>
        <p className="mt-2 text-sm text-gray-600">
          Agrega una imagen publicitaria con enlace de destino
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
            <h2 className="text-lg font-medium text-gray-900">Imagen</h2>
          </div>
          <div className="px-6 py-4">
            <SingleImageUploader
              imageUrl={imageUrl}
              onImageChange={setImageUrl}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Configuración</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                URL de Destino *
              </label>
              <input
                type="url"
                required
                value={urlDestino}
                onChange={(e) => setUrlDestino(e.target.value)}
                placeholder="https://ejemplo.com/pagina"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL a la que se redirigirá cuando se haga clic en la imagen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Promoción especial de verano"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Orden
                </label>
                <input
                  type="number"
                  min="0"
                  value={orden}
                  onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Las imágenes se mostrarán en orden ascendente (0 = primera)
                </p>
              </div>

              <div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm font-medium text-gray-700">
                    Activo
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/contenido/cta"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !imageUrl || !urlDestino.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Imagen CTA"}
          </button>
        </div>
      </form>
    </div>
  );
}

