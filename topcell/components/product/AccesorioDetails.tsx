"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface AccesorioDetailsProps {
  accesorio: {
    id: number;
    modelo: string;
    marca: string;
    marcaId: number;
    precio: number;
    descripcion: string;
    imagenes: string[];
    colores: {
      id: number;
      colorId: number;
      color: string;
      stock: number;
    }[];
  };
}

export default function AccesorioDetails({ accesorio }: AccesorioDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);

  // Auto-seleccionar primer color si hay colores disponibles
  useEffect(() => {
    if (accesorio.colores.length > 0 && !selectedColorId) {
      setSelectedColorId(accesorio.colores[0].colorId);
    }
  }, [accesorio.colores, selectedColorId]);

  const colorSeleccionado = accesorio.colores.find(c => c.colorId === selectedColorId);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % accesorio.imagenes.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + accesorio.imagenes.length) % accesorio.imagenes.length);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={accesorio.imagenes[currentImageIndex] || "/placeholder-phone.jpg"}
              alt={`${accesorio.marca} ${accesorio.modelo}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            
            {accesorio.imagenes.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
                  aria-label="Imagen anterior"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
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
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
                  aria-label="Siguiente imagen"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
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
              </>
            )}
          </div>

          {/* Miniaturas */}
          {accesorio.imagenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {accesorio.imagenes.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? "border-orange-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${accesorio.marca} ${accesorio.modelo} - Imagen ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{accesorio.marca}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{accesorio.modelo}</h1>
            <div className="text-4xl font-bold text-orange-500 mb-6">
              Q{accesorio.precio.toLocaleString("es-GT")}
            </div>
          </div>

          {/* Selección de color */}
          {accesorio.colores.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {accesorio.colores.map((colorItem) => (
                    <button
                      key={colorItem.colorId}
                      onClick={() => setSelectedColorId(colorItem.colorId)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedColorId === colorItem.colorId
                          ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {colorItem.color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock del color seleccionado */}
              {colorSeleccionado && (
                <div className="text-sm text-gray-600">
                  {colorSeleccionado.stock > 0 ? (
                    <span className="text-green-600 font-medium">
                      ✓ En stock ({colorSeleccionado.stock} disponibles)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Sin stock</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botón de agregar al carrito */}
          <button
            disabled={!colorSeleccionado || colorSeleccionado.stock === 0}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              colorSeleccionado && colorSeleccionado.stock > 0
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {colorSeleccionado && colorSeleccionado.stock > 0
              ? "Agregar al carrito"
              : accesorio.colores.length > 0
              ? "Selecciona un color"
              : "Sin stock"}
          </button>

          {/* Descripción */}
          {accesorio.descripcion && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-600 whitespace-pre-line">{accesorio.descripcion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

