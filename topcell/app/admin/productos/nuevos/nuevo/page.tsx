"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";

export default function NuevoTelefonoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    marcaId: "",
    modelo: "",
    precio: "",
    procesador: "",
    ram: "",
    rom: "",
    mpxlsCamara: "",
    tamanoPantalla: "",
    tipoEntrada: "",
    stock: "",
    descripcion: "",
    featured: false,
    variantes: [] as { colorId: number; rom: string; stock: number }[],
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar que haya al menos una variante antes de enviar
      if (formData.variantes.length === 0) {
        setError("Debe crear al menos una variante (color + almacenamiento + stock)");
        setLoading(false);
        return;
      }

      // Validar que todas las variantes estén completas
      const variantesIncompletas = formData.variantes.filter(
        (v) => !v.colorId || !v.rom || v.stock === undefined || v.stock === null
      );

      if (variantesIncompletas.length > 0) {
        setError("Todas las variantes deben tener color, almacenamiento y stock completos");
        setLoading(false);
        return;
      }

      // Preparar datos para enviar (agregar rom por defecto si no existe)
      const datosParaEnviar = {
        ...formData,
        rom: formData.rom || "128GB", // ROM por defecto si no se especifica
        colores: formData.variantes, // Enviar variantes como "colores" para compatibilidad con API
        imagenes: imagenes, // Incluir las URLs de las imágenes
      };

      console.log("Enviando datos:", datosParaEnviar);

      const response = await fetch("/api/admin/productos/nuevos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaEnviar),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error del servidor:", data);
        throw new Error(data.error || "Error al crear el teléfono");
      }

      router.push("/admin/productos/nuevos");
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
          href="/admin/productos/nuevos"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a teléfonos nuevos
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Nuevo Teléfono
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Agrega un nuevo teléfono al catálogo
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock Total
                </label>
                <input
                  type="number"
                  readOnly
                  value={
                    formData.variantes.reduce(
                      (sum, v) => sum + (v.stock || 0),
                      0
                    ) || ""
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Calculado automáticamente desde las variantes
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Especificaciones Técnicas
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Procesador *
                </label>
                <input
                  type="text"
                  required
                  value={formData.procesador}
                  onChange={(e) =>
                    setFormData({ ...formData, procesador: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  RAM *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ram}
                  onChange={(e) =>
                    setFormData({ ...formData, ram: e.target.value })
                  }
                  placeholder="Ej: 8GB"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cámara (MPXls) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.mpxlsCamara}
                  onChange={(e) =>
                    setFormData({ ...formData, mpxlsCamara: e.target.value })
                  }
                  placeholder="Ej: 48MP"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tamaño de Pantalla *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tamanoPantalla}
                  onChange={(e) =>
                    setFormData({ ...formData, tamanoPantalla: e.target.value })
                  }
                  placeholder="Ej: 6.1 pulgadas"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Entrada *
                </label>
                <select
                  required
                  value={formData.tipoEntrada}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoEntrada: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option value="USB-C">USB-C</option>
                  <option value="Lightning">Lightning</option>
                  <option value="Micro USB">Micro USB</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Variantes (Color + Almacenamiento) y Descripción
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Variantes del Producto
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Crea variantes combinando color y almacenamiento. Ej: Negro 128GB, Negro 256GB, Azul 128GB
              </p>
              
              {/* Lista de variantes creadas */}
              {formData.variantes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.variantes.map((variante, index) => {
                    const color = colores.find((c) => c.id === variante.colorId);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <span className="flex-1 text-sm font-medium text-gray-700">
                          {color?.color || "Color"} - {variante.rom} (Stock: {variante.stock})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              variantes: formData.variantes.filter((_, i) => i !== index),
                            });
                          }}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Formulario para agregar nueva variante */}
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Agregar Nueva Variante
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Color *
                    </label>
                    <select
                      id="new-variante-color"
                      className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar color</option>
                      {colores.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.color}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Almacenamiento *
                    </label>
                    <select
                      id="new-variante-rom"
                      className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="64GB">64GB</option>
                      <option value="128GB">128GB</option>
                      <option value="256GB">256GB</option>
                      <option value="512GB">512GB</option>
                      <option value="1TB">1TB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      id="new-variante-stock"
                      className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const colorSelect = document.getElementById("new-variante-color") as HTMLSelectElement;
                    const romSelect = document.getElementById("new-variante-rom") as HTMLSelectElement;
                    const stockInput = document.getElementById("new-variante-stock") as HTMLInputElement;

                    const colorId = parseInt(colorSelect.value);
                    const rom = romSelect.value;
                    const stock = parseInt(stockInput.value) || 0;

                    if (!colorId || !rom) {
                      alert("Por favor completa todos los campos");
                      return;
                    }

                    // Verificar si ya existe esta combinación
                    const existe = formData.variantes.some(
                      (v) => v.colorId === colorId && v.rom === rom
                    );

                    if (existe) {
                      alert("Esta variante ya existe");
                      return;
                    }

                    setFormData({
                      ...formData,
                      variantes: [
                        ...formData.variantes,
                        { colorId, rom, stock },
                      ],
                    });

                    // Limpiar campos
                    colorSelect.value = "";
                    romSelect.value = "";
                    stockInput.value = "";
                  }}
                  className="mt-3 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  + Agregar Variante
                </button>
              </div>
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

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Descripción</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción (opcional)
              </label>
              <textarea
                rows={4}
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/productos/nuevos"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Teléfono"}
          </button>
        </div>
      </form>
    </div>
  );
}

