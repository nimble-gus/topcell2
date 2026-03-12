"use client";

import { useState, useEffect } from "react";
import CloudinaryImage from "@/components/CloudinaryImage";
import { getCloudinaryOptimizedUrl } from "@/lib/cloudinary-utils";

interface SeminuevoImageGalleryProps {
  imagenes: string[];
  titulo: string;
}

export default function SeminuevoImageGallery({
  imagenes,
  titulo,
}: SeminuevoImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imagenes.length);
  };

  // Cerrar lightbox con Escape, navegar con flechas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
      }
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % imagenes.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, imagenes.length]);

  // Prevenir scroll del body cuando lightbox está abierto
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  if (imagenes.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-2xl bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400">Sin imágenes disponibles</span>
      </div>
    );
  }

  const currentImage = imagenes[currentIndex];
  const lightboxUrl = getCloudinaryOptimizedUrl(currentImage, "lightbox");

  return (
    <>
      <div className="space-y-4">
        {/* Imagen principal - clickeable para abrir lightbox */}
        <div
          className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <CloudinaryImage
            src={currentImage}
            alt={`${titulo} - Imagen ${currentIndex + 1}`}
            fill
            size="gallery"
            loading="eager"
          />

          {/* Flechas de navegación (solo si hay más de 1 imagen) */}
          {imagenes.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Imagen anterior"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Siguiente imagen"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
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
              </button>

              {/* Indicador de click para ampliar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Clic para ampliar
              </div>
            </>
          )}
        </div>

        {/* Miniaturas - todas las imágenes sin límite */}
        {imagenes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {imagenes.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-orange-500 ring-2 ring-orange-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CloudinaryImage
                  src={url}
                  alt={`${titulo} - Imagen ${index + 1}`}
                  fill
                  size="thumbnail"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Fondo oscuro con blur */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Contenedor de la imagen - click fuera cierra */}
          <div className="relative z-10 max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={lightboxUrl}
              alt={`${titulo} - Imagen ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Botón cerrar */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 transition-colors"
              aria-label="Cerrar"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Flechas en lightbox (si hay más de 1) */}
            {imagenes.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all"
                  aria-label="Imagen anterior"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all"
                  aria-label="Siguiente imagen"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>

                {/* Contador de imágenes */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                  {currentIndex + 1} / {imagenes.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
