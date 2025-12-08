"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";

interface ColorStock {
  colorId: number;
  stock: number;
}

export default function NuevoAccesorioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    marcaId: "",
    modelo: "",
    precio: "",
    descripcion: "",
    featured: false,
  });

  const [coloresStock, setColoresStock] = useState<ColorStock[]>([]);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [colores, setColores] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [marcasRes, coloresRes] = await Promise.all([
          fetch("/api/admin/marcas"),
          fetch("/api/admin/colores"),
        ]);

        const marcasData = await marcasRes.json();
        const coloresData = await coloresRes.json();

        setMarcas(marcasData);
        setColores(coloresData);
      } catch (error) {
        console.error("Error al cargar marcas y colores:", error);
      }
    }

    loadData();
  }, []);

  const handleAddColor = () => {
    const colorSelect = document.getElementById("new-color-select") as HTMLSelectElement;
    const stockInput = document.getElementById("new-color-stock") as HTMLInputElement;

    const colorId = parseInt(colorSelect.value);
    const stock = parseInt(stockInput.value) || 0;

    if (!colorId) {
      alert("Por favor selecciona un color");
      return;
    }

    // Verificar si ya existe este color
    const existe = coloresStock.some((c) => c.colorId === colorId);

    if (existe) {
      alert("Este color ya está agregado");
      return;
    }

    setColoresStock([...coloresStock, { colorId, stock }]);

    // Limpiar campos
    colorSelect.value = "";
    stockInput.value = "0";
  };

  const handleRemoveColor = (colorId: number) => {
    setColoresStock(coloresStock.filter((c) => c.colorId !== colorId));
  };

  const handleUpdateColorStock = (colorId: number, stock: number) => {
    setColoresStock(
      coloresStock.map((c) => (c.colorId === colorId ? { ...c, stock } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar que haya al menos un color con stock
      if (coloresStock.length === 0) {
        setError("Debe seleccionar al menos un color con stock");
        setLoading(false);
        return;
      }

      const datosParaEnviar = {
        ...formData,
        colores: coloresStock.map((c) => ({
          colorId: c.colorId,
          stock: c.stock,
        })),
        imagenes: imagenes,
      };

      console.log("Enviando datos:", datosParaEnviar);

      const response = await fetch("/api/admin/productos/accesorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaEnviar),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error del servidor:", data);
        throw new Error(data.error || "Error al crear el accesorio");
      }

      router.push("/admin/productos/accesorios");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/productos/accesorios"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a accesorios
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Nuevo Accesorio
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Agrega un nuevo accesorio al catálogo
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border-2 border-red-300 p-4">
          <p className="text-sm font-bold text-red-950">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Información Básica
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marca *
                </label>
                <select
                  required
                  value={formData.marcaId}
                  onChange={(e) =>
                    setFormData({ ...formData, marcaId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.modelo}
                  onChange={(e) =>
                    setFormData({ ...formData, modelo: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Ej: AirPods Pro 2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Precio (Q) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción *
              </label>
              <textarea
                rows={4}
                required
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Describe el accesorio..."
            />
          </div>

          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="featured" className="ml-2 block text-sm font-medium text-gray-700">
                Producto destacado (aparecerá en la sección Featured)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stock Total
            </label>
              <input
                type="number"
                readOnly
                value={
                  coloresStock.reduce((sum, c) => sum + (c.stock || 0), 0) || ""
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Calculado automáticamente desde los colores
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Colores y Stock
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Selecciona los colores disponibles y asigna el stock para cada uno
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* Lista de colores agregados */}
            {coloresStock.length > 0 && (
              <div className="space-y-2">
                {coloresStock.map((colorStock) => {
                  const color = colores.find((c) => c.id === colorStock.colorId);
                  return (
                    <div
                      key={colorStock.colorId}
                      className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3"
                    >
                      <span
                        className="inline-block h-5 w-5 rounded-full"
                        style={{ backgroundColor: color?.color.toLowerCase() }}
                        title={color?.color}
                      ></span>
                      <span className="flex-1 text-sm font-medium text-gray-700">
                        {color?.color || "Color"}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Stock:</label>
                        <input
                          type="number"
                          min="0"
                          value={colorStock.stock}
                          onChange={(e) =>
                            handleUpdateColorStock(
                              colorStock.colorId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(colorStock.colorId)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulario para agregar nuevo color */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Agregar Color
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Color *
                  </label>
                  <select
                    id="new-color-select"
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar color</option>
                    {colores
                      .filter((c) => !coloresStock.some((cs) => cs.colorId === c.id))
                      .map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.color}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    id="new-color-stock"
                    defaultValue="0"
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddColor}
                className="mt-3 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                + Agregar Color
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Imágenes del Producto
            </h2>
          </div>
          <div className="px-6 py-4">
            <ImageUploader
              images={imagenes}
              onImagesChange={setImagenes}
              maxImages={10}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/productos/accesorios"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Accesorio"}
          </button>
        </div>
      </form>
    </div>
  );
}

