"use client";

import Image from "next/image";
import Link from "next/link";

interface BannerImage {
  id: number;
  url: string;
  titulo: string | null;
  urlDestino: string | null;
  descripcion?: string | null;
  orden: number;
}

interface BannerSectionProps {
  banners: BannerImage[];
}

export default function BannerSection({ banners }: BannerSectionProps) {
  // Filtrar solo banners activos con URL de destino y ordenarlos
  const activeBanners = banners
    .filter((banner) => banner.urlDestino && banner.titulo) // Solo banners con URL de destino y título
    .sort((a, b) => a.orden - b.orden);

  if (activeBanners.length === 0) {
    return null; // No mostrar nada si no hay banners
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="space-y-8">
        {activeBanners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.urlDestino!}
            className="group relative block overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.01]"
          >
            {/* Imagen grande */}
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full overflow-hidden bg-gray-100">
              <Image
                src={banner.url}
                alt={banner.titulo || "Banner"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay con gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
              {/* Contenido sobre la imagen */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12">
                {/* Título */}
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-4">
                  {banner.titulo}
                </h2>
                
                {/* Descripción */}
                {banner.descripcion && (
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 max-w-2xl line-clamp-2 sm:line-clamp-none">
                    {banner.descripcion}
                  </p>
                )}
                
                {/* Call to Action */}
                <div className="flex items-center text-white font-semibold text-sm sm:text-base md:text-lg group-hover:translate-x-2 transition-transform">
                  Más información
                  <svg
                    className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

