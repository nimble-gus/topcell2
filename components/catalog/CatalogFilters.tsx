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
  
  const [tipoProducto, setTipoProducto] = useState<string>(searchParams.get("tipo") || "todos");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string>(searchParams.get("marca") || "todas");
  const [precioMin, setPrecioMin] = useState<string>(searchParams.get("precioMin") || "");
  const [precioMax, setPrecioMax] = useState<string>(searchParams.get("precioMax") || "");

  // Actualizar URL cuando cambien los filtros
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (tipoProducto !== "todos") {
      params.set("tipo", tipoProducto);
    }
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
    const newUrl = queryString ? `/catalogo?${queryString}` : "/catalogo";
    router.push(newUrl, { scroll: false });
  }, [tipoProducto, marcaSeleccionada, precioMin, precioMax, router]);

  const handleReset = () => {
    setTipoProducto("todos");
    setMarcaSeleccionada("todas");
    setPrecioMin("");
    setPrecioMax("");
    router.push("/catalogo", { scroll: false });
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
        {/* Filtro por tipo de producto */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Tipo de Producto</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="tipo"
                value="todos"
                checked={tipoProducto === "todos"}
                onChange={(e) => setTipoProducto(e.target.value)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Todos</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tipo"
                value="telefono-nuevo"
                checked={tipoProducto === "telefono-nuevo"}
                onChange={(e) => setTipoProducto(e.target.value)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Teléfonos Nuevos</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tipo"
                value="telefono-seminuevo"
                checked={tipoProducto === "telefono-seminuevo"}
                onChange={(e) => setTipoProducto(e.target.value)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Teléfonos Seminuevos</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tipo"
                value="accesorio"
                checked={tipoProducto === "accesorio"}
                onChange={(e) => setTipoProducto(e.target.value)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Accesorios</span>
            </label>
          </div>
        </div>

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

