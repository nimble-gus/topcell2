"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

const PRODUCTOS_POR_PAGINA = 16; // 4 columnas x 4 filas

export default function ProductGrid({ productos }: ProductGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Obtener filtros de la URL
  const tipoFiltro = searchParams.get("tipo") || "todos";
  const marcaFiltro = searchParams.get("marca") || "todas";
  const precioMinFiltro = searchParams.get("precioMin");
  const precioMaxFiltro = searchParams.get("precioMax");
  const paginaActual = parseInt(searchParams.get("pagina") || "1", 10);

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

  // Calcular paginación
  const totalProductos = productosFiltrados.length;
  const totalPaginas = Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA);
  const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const fin = inicio + PRODUCTOS_POR_PAGINA;
  const productosPagina = productosFiltrados.slice(inicio, fin);

  // Resetear a página 1 si la página actual es inválida
  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pagina", "1");
      router.push(`/catalogo?${params.toString()}`, { scroll: false });
    }
  }, [paginaActual, totalPaginas, searchParams, router]);

  const cambiarPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nuevaPagina === 1) {
      params.delete("pagina");
    } else {
      params.set("pagina", nuevaPagina.toString());
    }
    router.push(`/catalogo?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (productosFiltrados.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-medium">No se encontraron productos con los filtros seleccionados</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {inicio + 1}-{Math.min(fin, totalProductos)} de {totalProductos} {totalProductos === 1 ? "producto" : "productos"}
        </div>
        {totalPaginas > 1 && (
          <div className="text-sm text-gray-600">
            Página {paginaActual} de {totalPaginas}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {productosPagina.map((producto) => (
          <ProductCard key={`${producto.tipo}-${producto.id}`} producto={producto} />
        ))}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => {
              // Mostrar todas las páginas si son 7 o menos
              if (totalPaginas <= 7) {
                return (
                  <button
                    key={pagina}
                    onClick={() => cambiarPagina(pagina)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pagina === paginaActual
                        ? "bg-orange-500 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pagina}
                  </button>
                );
              }
              
              // Mostrar páginas con elipsis si hay muchas
              if (
                pagina === 1 ||
                pagina === totalPaginas ||
                (pagina >= paginaActual - 1 && pagina <= paginaActual + 1)
              ) {
                return (
                  <button
                    key={pagina}
                    onClick={() => cambiarPagina(pagina)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pagina === paginaActual
                        ? "bg-orange-500 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pagina}
                  </button>
                );
              }
              
              // Mostrar elipsis
              if (pagina === paginaActual - 2 || pagina === paginaActual + 2) {
                return (
                  <span key={pagina} className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              
              return null;
            })}
          </div>
          
          <button
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </>
  );
}

