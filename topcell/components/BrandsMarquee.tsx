"use client";

import Image from "next/image";

interface Brand {
  id: number;
  nombre: string;
  logoUrl: string | null;
}

interface BrandsMarqueeProps {
  brands: Brand[];
}

export default function BrandsMarquee({ brands }: BrandsMarqueeProps) {
  // Filtrar solo marcas con logo
  const brandsWithLogo = brands.filter((brand) => brand.logoUrl !== null);

  if (brandsWithLogo.length === 0) {
    return null;
  }

  // Duplicar las marcas para crear un efecto de bucle infinito
  const duplicatedBrands = [...brandsWithLogo, ...brandsWithLogo];

  return (
    <section className="bg-white border-y border-gray-200 py-6 sm:py-8 overflow-hidden">
      <div className="relative">
        {/* Contenedor con animación */}
        <div className="flex brands-marquee">
          {duplicatedBrands.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="flex-shrink-0 mx-4 sm:mx-6 md:mx-8 flex items-center justify-center"
              style={{ width: "150px" }}
            >
              {brand.logoUrl && (
                <div className="relative h-12 sm:h-14 md:h-16 w-full opacity-70 hover:opacity-100 transition-opacity duration-300">
                  <Image
                    src={brand.logoUrl}
                    alt={`Logo de ${brand.nombre}`}
                    fill
                    className="object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    sizes="(max-width: 640px) 150px, (max-width: 768px) 150px, 200px"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overlay gradients para efecto de fade en los bordes */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}

