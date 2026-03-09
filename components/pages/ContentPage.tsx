"use client";

import Image from "next/image";

interface ContentPageProps {
  titulo: string;
  bannerUrl: string | null;
  contenido: string | null;
}

export default function ContentPage({ titulo, bannerUrl, contenido }: ContentPageProps) {
  return (
    <div>
      {/* Banner: si hay imagen, se muestra sin texto encima para apreciarla mejor. object-contain evita zoom excesivo. */}
      {bannerUrl ? (
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-white">
          <Image
            src={bannerUrl}
            alt={titulo}
            fill
            className="object-contain object-center"
            sizes="100vw"
            priority
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/1] bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
            {titulo}
          </h1>
        </div>
      )}

      {/* Contenido */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {contenido ? (
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: contenido }}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              El contenido de esta página aún no ha sido configurado.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Por favor, configura el contenido desde el panel de administración.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

