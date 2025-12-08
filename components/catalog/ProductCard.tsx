"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Producto {
  id: number;
  tipo: "telefono-nuevo" | "telefono-seminuevo" | "accesorio";
  modelo: string;
  marca: string;
  marcaId: number;
  precio: number;
  precioMax: number;
  imagenes: string[];
  tieneVariantes: boolean;
}

interface ProductCardProps {
  producto: Producto;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = producto.imagenes.length > 1;
  const currentImage = producto.imagenes[currentImageIndex] || "/placeholder-phone.jpg";

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % producto.imagenes.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + producto.imagenes.length) % producto.imagenes.length);
  };

  const precioDisplay = producto.precio !== producto.precioMax
    ? `Q${producto.precio.toLocaleString("es-GT")} - Q${producto.precioMax.toLocaleString("es-GT")}`
    : `Q${producto.precio.toLocaleString("es-GT")}`;

  return (
    <Link
      href={`/producto/${producto.tipo === "telefono-nuevo" ? "telefono" : producto.tipo === "telefono-seminuevo" ? "seminuevo" : "accesorio"}/${producto.id}`}
      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02]"
    >
      {/* Contenedor de imagen con carousel */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={currentImage}
          alt={`${producto.marca} ${producto.modelo}`}
          fill
          className="object-cover transition-transform group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Indicadores de imagen */}
        {hasMultipleImages && (
          <>
            {/* Flecha izquierda */}
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Imagen anterior"
            >
              <svg
                className="w-5 h-5 text-gray-700"
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

            {/* Flecha derecha */}
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Siguiente imagen"
            >
              <svg
                className="w-5 h-5 text-gray-700"
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

            {/* Indicadores de puntos */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {producto.imagenes.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentImageIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Ver imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-3 sm:p-4">
        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{producto.marca}</p>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
          {producto.modelo}
        </h3>
        <p className="text-lg sm:text-xl font-bold text-orange-500">
          {precioDisplay}
        </p>
        {producto.tieneVariantes && (
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Varios precios disponibles</p>
        )}
      </div>
    </Link>
  );
}

