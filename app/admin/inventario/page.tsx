"use client";

import { useEffect, useState } from "react";

interface InventarioData {
  inventario: {
    telefonosNuevos: Array<{
      id: number;
      tipo: string;
      marca: string;
      modelo: string;
      variantes: Array<{
        id: number;
        color: string;
        rom: string;
        precio: number;
        stock: number;
      }>;
      stockTotal: number;
    }>;
    telefonosSeminuevos: Array<{
      id: number;
      tipo: string;
      marca: string;
      modelo: string;
      variantes: Array<{
        id: number;
        color: string;
        rom: string;
        estado: number;
        porcentajeBateria: number | null;
        precio: number;
        stock: number;
      }>;
      stockTotal: number;
    }>;
    accesorios: Array<{
      id: number;
      tipo: string;
      marca: string;
      modelo: string;
      precio: number;
      colores: Array<{
        id: number;
        color: string;
        stock: number;
      }>;
      stockTotal: number;
    }>;
  };
  estadisticas: {
    totalStock: {
      telefonosNuevos: number;
      telefonosSeminuevos: number;
      accesorios: number;
    };
    totalGeneral: number;
    cantidadProductos: {
      telefonosNuevos: number;
      telefonosSeminuevos: number;
      accesorios: number;
    };
  };
}

export default function InventarioPage() {
  const [data, setData] = useState<InventarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventario();
  }, [tipoFilter, search]);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tipoFilter) params.append("tipo", tipoFilter);
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/inventario?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar inventario");

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600 font-bold";
    if (stock < 5) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Error al cargar inventario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestión y visualización del stock de productos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total General</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {data.estadisticas.totalGeneral}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
          <div className="text-sm font-medium text-gray-500">Teléfonos Nuevos</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {data.estadisticas.totalStock.telefonosNuevos}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.estadisticas.cantidadProductos.telefonosNuevos} productos
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
          <div className="text-sm font-medium text-gray-500">Teléfonos Seminuevos</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {data.estadisticas.totalStock.telefonosSeminuevos}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.estadisticas.cantidadProductos.telefonosSeminuevos} productos
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
          <div className="text-sm font-medium text-gray-500">Accesorios</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {data.estadisticas.totalStock.accesorios}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.estadisticas.cantidadProductos.accesorios} productos
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Producto
            </label>
            <select
              id="tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos</option>
              <option value="nuevo">Teléfonos Nuevos</option>
              <option value="seminuevo">Teléfonos Seminuevos</option>
              <option value="accesorio">Accesorios</option>
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar (marca, modelo)
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Inventario de Teléfonos Nuevos */}
      {(!tipoFilter || tipoFilter === "nuevo") && data.inventario.telefonosNuevos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Teléfonos Nuevos</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variante
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.inventario.telefonosNuevos.map((producto) =>
                    producto.variantes.map((variante) => (
                      <tr key={variante.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium text-gray-900">
                            {producto.marca} {producto.modelo}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {variante.color} - {variante.rom}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          Q{variante.precio.toLocaleString("es-GT")}
                        </td>
                        <td className={`px-3 py-2 text-right text-sm font-semibold ${getStockColor(variante.stock)}`}>
                          {variante.stock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventario de Teléfonos Seminuevos */}
      {(!tipoFilter || tipoFilter === "seminuevo") && data.inventario.telefonosSeminuevos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Teléfonos Seminuevos</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variante
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.inventario.telefonosSeminuevos.map((producto) =>
                    producto.variantes.map((variante) => (
                      <tr key={variante.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium text-gray-900">
                            {producto.marca} {producto.modelo}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {variante.color} - {variante.rom} - Estado: {variante.estado}/10
                          {variante.porcentajeBateria && ` - ${variante.porcentajeBateria}%`}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          Q{variante.precio.toLocaleString("es-GT")}
                        </td>
                        <td className={`px-3 py-2 text-right text-sm font-semibold ${getStockColor(variante.stock)}`}>
                          {variante.stock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventario de Accesorios */}
      {(!tipoFilter || tipoFilter === "accesorio") && data.inventario.accesorios.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Accesorios</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.inventario.accesorios.map((producto) =>
                    producto.colores.map((color) => (
                      <tr key={color.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium text-gray-900">
                            {producto.marca} {producto.modelo}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{color.color}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          Q{producto.precio.toLocaleString("es-GT")}
                        </td>
                        <td className={`px-3 py-2 text-right text-sm font-semibold ${getStockColor(color.stock)}`}>
                          {color.stock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay resultados */}
      {data.inventario.telefonosNuevos.length === 0 &&
        data.inventario.telefonosSeminuevos.length === 0 &&
        data.inventario.accesorios.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No se encontraron productos en el inventario</p>
          </div>
        )}
    </div>
  );
}

