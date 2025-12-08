"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SingleImageUploader from "@/components/admin/SingleImageUploader";

interface ContenidoItem {
  id: number;
  tipo: string;
  url: string | null;
  descripcion: string | null;
  activo: boolean;
}

export default function ConocenosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [banner, setBanner] = useState<ContenidoItem | null>(null);
  const [contenido, setContenido] = useState<ContenidoItem | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [contenidoText, setContenidoText] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/admin/contenido");
      if (response.ok) {
        const data = await response.json();
        const bannerItem = data.find((item: ContenidoItem) => item.tipo === "conocenos-banner");
        const contenidoItem = data.find((item: ContenidoItem) => item.tipo === "conocenos-contenido");
        
        setBanner(bannerItem || null);
        setContenido(contenidoItem || null);
        setBannerUrl(bannerItem?.url || "");
        setContenidoText(contenidoItem?.descripcion || "");
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Guardar/actualizar banner
      if (bannerUrl) {
        if (banner) {
          await fetch(`/api/admin/contenido/${banner.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: bannerUrl,
              activo: true,
            }),
          });
        } else {
          await fetch("/api/admin/contenido", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "conocenos-banner",
              url: bannerUrl,
              activo: true,
              orden: 0,
            }),
          });
        }
      }

      // Guardar/actualizar contenido
      if (contenido) {
        await fetch(`/api/admin/contenido/${contenido.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descripcion: contenidoText,
            activo: true,
          }),
        });
      } else {
        await fetch("/api/admin/contenido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "conocenos-contenido",
            url: "",
            descripcion: contenidoText,
            activo: true,
            orden: 0,
          }),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
      loadData();
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
      <div className="mb-6">
        <Link
          href="/admin/contenido"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Volver a Contenido
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gestionar Conócenos</h1>
      </div>

      <div className="max-w-4xl space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-300 text-green-950 font-bold px-4 py-3 rounded-lg">
            Cambios guardados correctamente
          </div>
        )}

        {/* Banner */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner</h2>
          <SingleImageUploader
            imageUrl={bannerUrl || null}
            onImageChange={(url) => setBannerUrl(url || "")}
            folder="contenido"
          />
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido</h2>
          <textarea
            value={contenidoText}
            onChange={(e) => setContenidoText(e.target.value)}
            rows={15}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Ingresa el contenido de la página. Puedes usar HTML para formatear el texto."
          />
          <p className="mt-2 text-sm text-gray-500">
            Puedes usar HTML para formatear el texto (párrafos, listas, negritas, etc.)
          </p>
        </div>

        {/* Botón guardar */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          <Link
            href="/admin/contenido"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}

