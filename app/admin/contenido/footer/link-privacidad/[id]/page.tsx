"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditarLinkPrivacidadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/admin/contenido/${id}`);
        if (!response.ok) {
          throw new Error("Link no encontrado");
        }

        const data = await response.json();
        setUrl(data.urlDestino || "");
      } catch (error: any) {
        setError(error.message || "Error al cargar el link");
      } finally {
        setLoading(false);
      }
    }

    if (id && id !== "nuevo") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!url.trim()) {
      setError("Debes especificar una URL");
      setSaving(false);
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("La URL no es válida");
      setSaving(false);
      return;
    }

    try {
      const apiUrl = id === "nuevo" ? "/api/admin/contenido" : `/api/admin/contenido/${id}`;
      const method = id === "nuevo" ? "POST" : "PUT";

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "footer-link-privacidad",
          url: "https://placeholder.com",
          urlDestino: url.trim(),
          activo: true,
          orden: 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar link");
      }

      router.push("/admin/contenido/footer");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {id === "nuevo" ? "Agregar" : "Editar"} Link "Política de Privacidad"
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Configura la URL del link "Política de Privacidad" del footer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 border-2 border-red-300">
              <p className="text-sm font-bold text-red-950">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              URL *
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="https://topcell.com/privacidad"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

