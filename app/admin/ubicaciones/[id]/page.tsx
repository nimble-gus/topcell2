"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import SingleImageUploader from "@/components/admin/SingleImageUploader";

export default function EditarLocalidadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    imagenUrl: "",
    titulo: "",
    direccion: "",
    telefono: "",
    horario: "",
    linkGoogleMaps: "",
    linkWaze: "",
    activo: true,
    orden: 0,
  });

  useEffect(() => {
    loadLocalidad();
  }, [id]);

  const loadLocalidad = async () => {
    try {
      const response = await fetch(`/api/admin/localidades/${id}`);
      if (!response.ok) {
        throw new Error("Localidad no encontrada");
      }
      const data = await response.json();
      setFormData({
        imagenUrl: data.imagenUrl || "",
        titulo: data.titulo || "",
        direccion: data.direccion || "",
        telefono: data.telefono || "",
        horario: data.horario || "",
        linkGoogleMaps: data.linkGoogleMaps || "",
        linkWaze: data.linkWaze || "",
        activo: data.activo !== undefined ? data.activo : true,
        orden: data.orden || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!formData.imagenUrl || !formData.titulo || !formData.direccion) {
        setError("Por favor completa todos los campos requeridos (imagen, título y dirección)");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/localidades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          telefono: formData.telefono || null,
          linkGoogleMaps: formData.linkGoogleMaps || null,
          linkWaze: formData.linkWaze || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar la localidad");
      }

      router.push("/admin/ubicaciones");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando localidad...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/ubicaciones"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Volver a Ubicaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Localidad</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Imagen */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del Local *
          </label>
          <SingleImageUploader
            imageUrl={formData.imagenUrl || null}
            onImageChange={(url) => setFormData({ ...formData, imagenUrl: url || "" })}
            folder="ubicaciones"
          />
        </div>

        {/* Información básica */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Lugar *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <textarea
              required
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horario de Atención
            </label>
            <textarea
              value={formData.horario}
              onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Ej: Lunes a Viernes: 9:00 AM - 6:00 PM&#10;Sábados: 9:00 AM - 1:00 PM"
            />
          </div>
        </div>

        {/* Links de navegación */}
        <div className="bg-white rounded-lg border border-gray-200 shadow p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Links de Navegación</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link de Google Maps
            </label>
            <input
              type="url"
              value={formData.linkGoogleMaps}
              onChange={(e) => setFormData({ ...formData, linkGoogleMaps: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link de Waze
            </label>
            <input
              type="url"
              value={formData.linkWaze}
              onChange={(e) => setFormData({ ...formData, linkWaze: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orden
            </label>
            <input
              type="number"
              min="0"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
              Activo (visible en la página pública)
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          <Link
            href="/admin/ubicaciones"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

