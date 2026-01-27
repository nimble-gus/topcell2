"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Marca {
  id: number;
  nombre: string;
}

interface CatalogFiltersProps {
  marcas: Marca[];
}

export default function CatalogFilters({ marcas }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>(searchParams.get("marca") || "todas");
  const [precioMin, setPrecioMin] = useState<string>(searchParams.get("precioMin") || "");
  const [precioMax, setPrecioMax] = useState<string>(searchParams.get("precioMax") || "");

  // Actualizar URL cuando cambien los filtros
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (marcaSeleccionada !== "todas") {
      params.set("marca", marcaSeleccionada);
    }
    if (precioMin) {
      params.set("precioMin", precioMin);
    }
    if (precioMax) {
      params.set("precioMax", precioMax);
    }

    const queryString = params.toString();
    // Detectar la ruta actual para mantenerla
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/catalogo";
    const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath;
    router.push(newUrl, { scroll: false });
  }, [marcaSeleccionada, precioMin, precioMax, router]);

  const handleReset = () => {
    setMarcaSeleccionada("todas");
    setPrecioMin("");
    setPrecioMax("");
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/catalogo";
    router.push(currentPath, { scroll: false });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        <button
          onClick={handleReset}
          className="text-sm text-orange-500 hover:text-orange-600 font-medium"
        >
          Limpiar
        </button>
      </div>

      <div className="space-y-6">
        {/* Filtro por marca */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Marca</h3>
          <select
            value={marcaSeleccionada}
            onChange={(e) => setMarcaSeleccionada(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
          >
            <option value="todas">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id.toString()}>
                {marca.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por precio */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Precio</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mínimo (Q)</label>
              <input
                type="number"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Máximo (Q)</label>
              <input
                type="number"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                placeholder="Sin límite"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

