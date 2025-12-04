"use client";

import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";

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

interface ProductGridProps {
  productos: Producto[];
}

export default function ProductGrid({ productos }: ProductGridProps) {
  const searchParams = useSearchParams();
  
  // Obtener filtros de la URL
  const tipoFiltro = searchParams.get("tipo") || "todos";
  const marcaFiltro = searchParams.get("marca") || "todas";
  const precioMinFiltro = searchParams.get("precioMin");
  const precioMaxFiltro = searchParams.get("precioMax");

  // Filtrar productos
  let productosFiltrados = productos;

  // Filtro por tipo
  if (tipoFiltro !== "todos") {
    productosFiltrados = productosFiltrados.filter(
      (p) => p.tipo === tipoFiltro
    );
  }

  // Filtro por marca
  if (marcaFiltro !== "todas") {
    productosFiltrados = productosFiltrados.filter(
      (p) => p.marcaId.toString() === marcaFiltro
    );
  }

  // Filtro por precio mínimo
  if (precioMinFiltro) {
    const min = parseFloat(precioMinFiltro);
    if (!isNaN(min)) {
      productosFiltrados = productosFiltrados.filter(
        (p) => p.precioMax >= min
      );
    }
  }

  // Filtro por precio máximo
  if (precioMaxFiltro) {
    const max = parseFloat(precioMaxFiltro);
    if (!isNaN(max)) {
      productosFiltrados = productosFiltrados.filter(
        (p) => p.precio <= max
      );
    }
  }

  if (productosFiltrados.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-medium">No se encontraron productos con los filtros seleccionados</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {productosFiltrados.length} {productosFiltrados.length === 1 ? "producto" : "productos"}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productosFiltrados.map((producto) => (
          <ProductCard key={`${producto.tipo}-${producto.id}`} producto={producto} />
        ))}
      </div>
    </>
  );
}

