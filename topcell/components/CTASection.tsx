"use client";

import Image from "next/image";
import Link from "next/link";

interface CTAImage {
  id: number;
  url: string;
  urlDestino: string | null;
  descripcion?: string | null;
  orden: number;
}

interface CTASectionProps {
  images: CTAImage[];
}

export default function CTASection({ images }: CTASectionProps) {
  // Filtrar solo imágenes activas y ordenarlas
  const activeImages = images
    .filter((img) => img.urlDestino) // Solo imágenes con URL de destino
    .sort((a, b) => a.orden - b.orden);

  if (activeImages.length === 0) {
    return null; // No mostrar nada si no hay imágenes
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeImages.map((image) => (
          <Link
            key={image.id}
            href={image.urlDestino!}
            className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
              <Image
                src={image.url}
                alt={image.descripcion || "Publicidad"}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
            </div>
            {image.descripcion && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-medium">{image.descripcion}</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

