"use client";

import Image from "next/image";

interface Localidad {
  id: number;
  imagenUrl: string;
  titulo: string;
  direccion: string;
  telefono: string | null;
  linkGoogleMaps: string | null;
  linkWaze: string | null;
}

interface LocalidadesGridProps {
  localidades: Localidad[];
}

export default function LocalidadesGrid({ localidades }: LocalidadesGridProps) {
  if (localidades.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay ubicaciones disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {localidades.map((localidad) => (
        <div
          key={localidad.id}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-xl transition-all"
        >
          {/* Imagen */}
          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
            <Image
              src={localidad.imagenUrl}
              alt={localidad.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Información */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {localidad.titulo}
            </h2>
            
            <div className="space-y-3">
              {/* Dirección */}
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-gray-600 text-sm">{localidad.direccion}</p>
              </div>

              {/* Teléfono */}
              {localidad.telefono && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a
                    href={`tel:${localidad.telefono}`}
                    className="text-gray-600 text-sm hover:text-orange-500 transition-colors"
                  >
                    {localidad.telefono}
                  </a>
                </div>
              )}

              {/* Links de navegación */}
              <div className="flex gap-3 pt-2">
                {localidad.linkGoogleMaps && (
                  <a
                    href={localidad.linkGoogleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Google Maps
                  </a>
                )}
                {localidad.linkWaze && (
                  <a
                    href={localidad.linkWaze}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#33CCFF] hover:bg-[#2BB5E6] text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    Waze
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

