"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface FeaturedProduct {
  id: number;
  modelo?: string; // Para teléfonos y accesorios
  descripcion?: string; // Para accesorios (opcional)
  precio: number;
  imagenUrl: string;
  marca: {
    id: number;
    nombre: string;
    logoUrl: string | null;
  };
}

interface MarcaConTelefonos {
  marca: {
    id: number;
    nombre: string;
    logoUrl: string | null;
  };
  telefonos: FeaturedProduct[];
}

interface FeaturedSectionProps {
  telefonosPorMarca: MarcaConTelefonos[];
  accesorios: FeaturedProduct[];
}

export default function FeaturedSection({
  telefonosPorMarca,
  accesorios,
}: FeaturedSectionProps) {
  const [activeTab, setActiveTab] = useState<"telefonos" | "accesorios">("telefonos");
  const [currentMarcaIndex, setCurrentMarcaIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play carousel de marcas (solo para teléfonos)
  useEffect(() => {
    if (activeTab !== "telefonos" || telefonosPorMarca.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMarcaIndex((prev) => (prev + 1) % telefonosPorMarca.length);
        setIsTransitioning(false);
      }, 300); // Duración de la transición
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [activeTab, telefonosPorMarca.length]);

  // Resetear índice cuando cambia el tab
  useEffect(() => {
    setCurrentMarcaIndex(0);
    setIsTransitioning(false);
  }, [activeTab]);

  const currentMarca = telefonosPorMarca[currentMarcaIndex];
  const activeProducts = activeTab === "telefonos" 
    ? (currentMarca?.telefonos || [])
    : accesorios;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Tabs */}
      <div className="mb-6 sm:mb-8 flex items-center justify-center gap-4 sm:gap-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("telefonos")}
          className={`relative pb-3 sm:pb-4 text-base sm:text-lg font-semibold transition-colors ${
            activeTab === "telefonos"
              ? "text-orange-500"
              : "text-gray-700 hover:text-gray-900"
          }`}
        >
          Teléfonos
          {activeTab === "telefonos" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("accesorios")}
          className={`relative pb-3 sm:pb-4 text-base sm:text-lg font-semibold transition-colors ${
            activeTab === "accesorios"
              ? "text-orange-500"
              : "text-gray-700 hover:text-gray-900"
          }`}
        >
          Accesorios
          {activeTab === "accesorios" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
      </div>

      {/* Logo de la marca con transición (solo para teléfonos) */}
      {activeTab === "telefonos" && currentMarca?.marca.logoUrl && (
        <div className="mb-8 sm:mb-12 flex justify-center">
          <div 
            className={`relative h-12 sm:h-16 md:h-20 w-48 sm:w-56 md:w-64 flex items-center justify-center transition-all duration-500 ${
              isTransitioning 
                ? "opacity-0 scale-95" 
                : "opacity-100 scale-100"
            }`}
          >
            <Image
              src={currentMarca.marca.logoUrl}
              alt={`Logo ${currentMarca.marca.nombre}`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 256px"
              priority
            />
          </div>
        </div>
      )}

      {/* Indicadores de marca (solo para teléfonos con múltiples marcas) */}
      {activeTab === "telefonos" && telefonosPorMarca.length > 1 && (
        <div className="mb-8 flex justify-center gap-2">
          {telefonosPorMarca.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentMarcaIndex(index);
                  setIsTransitioning(false);
                }, 300);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentMarcaIndex
                  ? "w-8 bg-orange-500"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Ver marca ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Productos destacados */}
      {activeProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">
            No hay {activeTab === "telefonos" ? "teléfonos" : "accesorios"} destacados disponibles
          </p>
        </div>
      ) : (
        <div 
          className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all duration-500 ${
            isTransitioning 
              ? "opacity-0 translate-y-4" 
              : "opacity-100 translate-y-0"
          }`}
        >
          {activeProducts.map((product) => (
            <Link
              key={product.id}
              href={`/producto/${activeTab === "telefonos" ? "telefono" : "accesorio"}/${product.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              {/* Imagen del producto */}
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={product.imagenUrl}
                  alt={product.modelo || product.descripcion || "Producto"}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </div>

              {/* Información del producto */}
              <div className="p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                  {product.modelo || product.descripcion || "Producto"}
                </h3>
                <p className="text-lg sm:text-xl font-bold text-orange-500">
                  Q{Number(product.precio).toLocaleString("es-GT")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
