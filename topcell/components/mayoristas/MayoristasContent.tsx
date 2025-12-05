"use client";

import { useState } from "react";

interface MayoristasContentProps {
  videoUrl: string | null;
}

export default function MayoristasContent({ videoUrl }: MayoristasContentProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    nombreEmpresa: "",
    departamento: "",
    municipio: "",
  });

  // Convertir URL de YouTube a embed
  const getEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    // Si ya es una URL de embed, devolverla
    if (url.includes("youtube.com/embed")) {
      return url;
    }
    
    // Extraer ID del video de diferentes formatos de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/mayoristas/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar la solicitud");
      }

      setSuccess(true);
      setFormData({
        nombre: "",
        telefono: "",
        direccion: "",
        nombreEmpresa: "",
        departamento: "",
        municipio: "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Programa de Mayoristas
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Únete a nuestro programa de mayoristas y obtén beneficios exclusivos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Video */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Conoce Nuestro Programa
          </h2>
          {embedUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              <iframe
                src={embedUrl}
                title="Video del Programa de Mayoristas"
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Video no disponible</p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Solicita Información
          </h2>
          
          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-300 text-green-950 font-bold px-4 py-3 rounded-lg">
              ¡Solicitud enviada correctamente! Nos pondremos en contacto contigo pronto.
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
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
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.nombreEmpresa}
                onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

