"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SingleImageUploader from "@/components/admin/SingleImageUploader";

export default function GestionarLogoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoId, setLogoId] = useState<number | null>(null);

  useEffect(() => {
    async function loadLogo() {
      try {
        const response = await fetch("/api/admin/contenido?tipo=logo");
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setLogoUrl(data[0].url);
            setLogoId(data[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error al cargar logo:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = logoId
        ? `/api/admin/contenido/${logoId}`
        : "/api/admin/contenido";

      const response = await fetch(url, {
        method: logoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "logo",
          url: logoUrl || "",
          descripcion: "Logo principal",
          activo: true,
          orden: 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar el logo");
      }

      router.push("/admin/contenido");
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
          href="/admin/contenido"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a contenido
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Gestionar Logo</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sube o actualiza el logo de la tienda
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
            <h2 className="text-lg font-medium text-gray-900">Logo de la Tienda</h2>
            <p className="mt-1 text-sm text-gray-600">
              El logo aparecerá en el header de la página principal
            </p>
          </div>
          <div className="px-6 py-4">
            <SingleImageUploader
              imageUrl={logoUrl}
              onImageChange={setLogoUrl}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/contenido"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !logoUrl}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Logo"}
          </button>
        </div>
      </form>
    </div>
  );
}

