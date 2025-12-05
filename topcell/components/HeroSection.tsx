"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface HeroImage {
  id: number;
  url: string;
  descripcion?: string | null;
  orden: number;
}

interface HeroSectionProps {
  images: HeroImage[];
}

export default function HeroSection({ images }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [images.length, isAutoPlaying]);

  if (!images || images.length === 0) {
    return (
      <section className="relative h-[600px] w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-3xl">
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500 font-medium">No hay imágenes disponibles</p>
        </div>
      </section>
    );
  }

  const sortedImages = [...images].sort((a, b) => a.orden - b.orden);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Reanudar auto-play después de 10 segundos
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full overflow-hidden rounded-b-3xl">
      {/* Images */}
      <div className="relative h-full w-full">
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.url}
              alt={image.descripcion || `Hero image ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Overlay blurry opcional */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {sortedImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-md p-2 sm:p-3 text-gray-800 shadow-xl transition-all hover:bg-white hover:scale-110 hover:shadow-2xl"
            aria-label="Imagen anterior"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-md p-2 sm:p-3 text-gray-800 shadow-xl transition-all hover:bg-white hover:scale-110 hover:shadow-2xl"
            aria-label="Imagen siguiente"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {sortedImages.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 sm:gap-2 bg-white/60 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 sm:h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 sm:w-8 bg-orange-500"
                  : "w-2 sm:w-2.5 bg-white/70 hover:bg-white"
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

