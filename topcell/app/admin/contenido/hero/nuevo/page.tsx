"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";

interface HeroImage {
  url: string;
  descripcion: string;
  orden: number;
}

export default function NuevaHeroImagePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);

  // Actualizar heroImages cuando se agregan nuevas imágenes
  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
    // Crear objetos HeroImage para las nuevas imágenes
    const newHeroImages: HeroImage[] = newImages.map((url, index) => {
      // Buscar si ya existe un HeroImage para esta URL
      const existing = heroImages.find((hi) => hi.url === url);
      if (existing) {
        return existing;
      }
      // Crear uno nuevo con orden basado en el índice
      return {
        url,
        descripcion: "",
        orden: index,
      };
    });
    setHeroImages(newHeroImages);
  };

  // Actualizar descripción u orden de una imagen específica
  const updateHeroImage = (url: string, field: "descripcion" | "orden", value: string | number) => {
    setHeroImages((prev) =>
      prev.map((hi) => (hi.url === url ? { ...hi, [field]: value } : hi))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (images.length === 0) {
      setError("Debes subir al menos una imagen");
      setSaving(false);
      return;
    }

    try {
      // Guardar todas las imágenes
      const promises = heroImages.map((heroImage) =>
        fetch("/api/admin/contenido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "hero",
            url: heroImage.url,
            descripcion: heroImage.descripcion || null,
            activo: true,
            orden: heroImage.orden,
          }),
        })
      );

      const responses = await Promise.all(promises);

      // Verificar si todas las respuestas son exitosas
      for (const response of responses) {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al guardar una imagen");
        }
      }

      router.push("/admin/contenido");
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
          href="/admin/contenido"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a contenido
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Nuevas Imágenes del Hero</h1>
        <p className="mt-2 text-sm text-gray-600">
          Agrega una o más imágenes al carousel del hero
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
            <h2 className="text-lg font-medium text-gray-900">Imágenes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Puedes subir múltiples imágenes a la vez
            </p>
          </div>
          <div className="px-6 py-4">
            <ImageUploader
              images={images}
              onImagesChange={handleImagesChange}
              maxImages={20}
            />
          </div>
        </div>

        {/* Información para cada imagen */}
        {heroImages.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">
                Información de las Imágenes
              </h2>
            </div>
            <div className="px-6 py-4 space-y-6">
              {heroImages.map((heroImage, index) => (
                <div
                  key={heroImage.url}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="mb-4 flex items-start gap-4">
                    <img
                      src={heroImage.url}
                      alt={`Hero ${index + 1}`}
                      className="h-24 w-40 rounded object-cover border border-gray-200"
                    />
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Descripción (opcional) - Imagen {index + 1}
                        </label>
                        <input
                          type="text"
                          value={heroImage.descripcion}
                          onChange={(e) =>
                            updateHeroImage(heroImage.url, "descripcion", e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Ej: Promoción especial de verano"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Orden
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={heroImage.orden}
                          onChange={(e) =>
                            updateHeroImage(
                              heroImage.url,
                              "orden",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Las imágenes se mostrarán en orden ascendente (0 = primera)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/contenido"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || images.length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving
              ? `Guardando ${images.length} imagen${images.length > 1 ? "es" : ""}...`
              : `Guardar ${images.length} Imagen${images.length > 1 ? "es" : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
}

