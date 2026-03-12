"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CloudinaryImage from "@/components/CloudinaryImage";
import { getCloudinaryOptimizedUrl } from "@/lib/cloudinary-utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Reset zoom/pan al cambiar de imagen
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

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
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
      }
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % imagenes.length);
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
      }
      if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, imagenes.length]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  }, []);

  // Necesario para que preventDefault funcione en wheel (eventos pasivos)
  const wheelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wheelRef.current;
    if (!el || !lightboxOpen) return;
    const preventScroll = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", preventScroll, { passive: false });
    return () => el.removeEventListener("wheel", preventScroll);
  }, [lightboxOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [zoom, pan]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || zoom <= 1) return;
      setPan({
        x: dragStart.current.panX + e.clientX - dragStart.current.x,
        y: dragStart.current.panY + e.clientY - dragStart.current.y,
      });
    },
    [isDragging, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
  // Usar "gallery" = misma URL que el carrusel → instantáneo desde caché
  const lightboxUrl = getCloudinaryOptimizedUrl(currentImage, "gallery");

  // Precarga imágenes adyacentes para navegación rápida
  useEffect(() => {
    if (!lightboxOpen || imagenes.length <= 1) return;
    const prevIndex = (currentIndex - 1 + imagenes.length) % imagenes.length;
    const nextIndex = (currentIndex + 1) % imagenes.length;
    [prevIndex, nextIndex].forEach((i) => {
      const img = new Image();
      img.src = getCloudinaryOptimizedUrl(imagenes[i], "gallery");
    });
  }, [lightboxOpen, currentIndex, imagenes]);

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
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Fondo oscuro con blur */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Contenedor: mucho más grande que la imagen principal del carrusel */}
          <div
            ref={wheelRef}
            className="relative z-10 w-[95vw] max-w-7xl h-[90vh] flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
          >
            <img
              src={lightboxUrl}
              alt={`${titulo} - Imagen ${currentIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl select-none touch-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setZoom((z) => (z > 1 ? 1 : 2));
                setPan({ x: 0, y: 0 });
              }}
              draggable={false}
            />

            {/* Botones de zoom */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 rounded-full px-2 py-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
                  if (zoom <= 1.5) setPan({ x: 0, y: 0 });
                }}
                className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Reducir zoom"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-white text-sm min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
                }}
                className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Aumentar zoom"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

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
