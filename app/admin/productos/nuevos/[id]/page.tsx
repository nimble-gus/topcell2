"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";

interface Marca {
  id: number;
  nombre: string;
}

interface Color {
  id: number;
  color: string;
}

interface Variante {
  id?: number;
  colorId: number;
  rom: string;
  precio: number;
  stock: number;
  imagenes?: string[]; // Imágenes específicas de la variante
}

interface TelefonoNuevoFormData {
  marcaId: string;
  modelo: string;
  precio: string;
  procesador: string;
  ram: string;
  mpxlsCamara: string;
  tamanoPantalla: string;
  tipoEntrada: string;
  descripcion: string;
  featured: boolean;
  variantes: Variante[];
}

export default function EditarTelefonoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<TelefonoNuevoFormData>({
    marcaId: "",
    modelo: "",
    precio: "",
    procesador: "",
    ram: "",
    mpxlsCamara: "",
    tamanoPantalla: "",
    tipoEntrada: "",
    descripcion: "",
    featured: false,
    variantes: [],
  });

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [imagenes, setImagenes] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Cargar marcas y colores
        const [marcasRes, coloresRes, telefonoRes] = await Promise.all([
          fetch("/api/admin/marcas"),
          fetch("/api/admin/colores"),
          fetch(`/api/admin/productos/nuevos/${id}`),
        ]);

        if (!telefonoRes.ok) {
          throw new Error("Teléfono no encontrado");
        }

        const marcasData = await marcasRes.json();
        const coloresData = await coloresRes.json();
        const telefonoData = await telefonoRes.json();

        setMarcas(marcasData);
        setColores(coloresData);

        // Cargar datos del teléfono
        setFormData({
          marcaId: telefonoData.marcaId.toString(),
          modelo: telefonoData.modelo,
          precio: telefonoData.precio.toString(),
          procesador: telefonoData.procesador,
          ram: telefonoData.ram,
          mpxlsCamara: telefonoData.mpxlsCamara,
          tamanoPantalla: telefonoData.tamanoPantalla,
          tipoEntrada: telefonoData.tipoEntrada,
          descripcion: telefonoData.descripcion || "",
          featured: telefonoData.featured || false,
          variantes: telefonoData.variantes.map((v: any) => ({
            id: v.id,
            colorId: v.colorId,
            rom: v.rom,
            precio: v.precio ? Number(v.precio) : (telefonoData.precio ? Number(telefonoData.precio) : 0),
            stock: v.stock,
            imagenes: v.imagenes ? v.imagenes.map((img: any) => img.url) : [],
          })),
        });

        // Cargar imágenes existentes
        if (telefonoData.imagenes && telefonoData.imagenes.length > 0) {
          setImagenes(telefonoData.imagenes.map((img: any) => img.url));
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Validar que haya al menos una variante
      if (formData.variantes.length === 0) {
        setError("Debe crear al menos una variante (color + almacenamiento + stock)");
        setSaving(false);
        return;
      }

      // Validar que todas las variantes estén completas
      const variantesIncompletas = formData.variantes.filter(
        (v) => !v.colorId || !v.rom || v.precio === undefined || v.precio === null || v.precio <= 0 || v.stock === undefined || v.stock === null
      );

      if (variantesIncompletas.length > 0) {
        setError("Todas las variantes deben tener color, almacenamiento, precio y stock completos");
        setSaving(false);
        return;
      }

      const datosParaEnviar = {
        ...formData,
        rom: "128GB", // ROM por defecto
        variantes: formData.variantes.map((v) => ({
          id: v.id,
          colorId: v.colorId,
          rom: v.rom,
          precio: v.precio,
          stock: v.stock,
          imagenes: v.imagenes || [], // Imágenes específicas de la variante
        })),
        imagenes: imagenes, // Imágenes generales del producto
      };

      console.log("Enviando datos para actualizar:", datosParaEnviar);

      const response = await fetch(`/api/admin/productos/nuevos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaEnviar),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error del servidor:", data);
        throw new Error(data.error || "Error al actualizar el teléfono");
      }

      router.push("/admin/productos/nuevos");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = () => {
    const colorSelect = document.getElementById("new-variante-color") as HTMLSelectElement;
    const romSelect = document.getElementById("new-variante-rom") as HTMLSelectElement;
    const precioInput = document.getElementById("new-variante-precio") as HTMLInputElement;
    const stockInput = document.getElementById("new-variante-stock") as HTMLInputElement;

    const colorId = parseInt(colorSelect.value);
    const rom = romSelect.value;
    const precio = parseFloat(precioInput.value) || 0;
    const stock = parseInt(stockInput.value) || 0;

    if (!colorId || !rom || precio <= 0) {
      alert("Por favor completa todos los campos (color, almacenamiento y precio son requeridos)");
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
        { colorId, rom, precio, stock, imagenes: [] },
      ],
    });

    // Limpiar campos
    colorSelect.value = "";
    romSelect.value = "";
    precioInput.value = "";
    stockInput.value = "";
  };

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variantes: formData.variantes.filter((_, i) => i !== index),
    });
  };

  const handleUpdateVariant = (index: number, field: keyof Variante, value: any) => {
    const updatedVariantes = [...formData.variantes];
    updatedVariantes[index] = {
      ...updatedVariantes[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      variantes: updatedVariantes,
    });
  };

  const handleUpdateVariantImages = (index: number, images: string[]) => {
    const updatedVariantes = [...formData.variantes];
    updatedVariantes[index] = {
      ...updatedVariantes[index],
      imagenes: images,
    };
    setFormData({
      ...formData,
      variantes: updatedVariantes,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

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
          Editar Teléfono
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifica la información del teléfono
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

              {/* Lista de variantes existentes */}
              {formData.variantes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.variantes.map((variante, index) => {
                    const color = colores.find((c) => c.id === variante.colorId);
                    return (
                      <div
                        key={index}
                        className="rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">
                              Color *
                            </label>
                            <select
                              value={variante.colorId}
                              onChange={(e) =>
                                handleUpdateVariant(index, "colorId", parseInt(e.target.value))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="">Seleccionar color</option>
                              {colores.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.color}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">
                              Almacenamiento *
                            </label>
                            <select
                              value={variante.rom}
                              onChange={(e) =>
                                handleUpdateVariant(index, "rom", e.target.value)
                              }
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
                              Precio (Q) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variante.precio}
                              onChange={(e) =>
                                handleUpdateVariant(index, "precio", parseFloat(e.target.value) || 0)
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">
                              Stock *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={variante.stock}
                              onChange={(e) =>
                                handleUpdateVariant(index, "stock", parseInt(e.target.value) || 0)
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(index)}
                              className="w-full rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        {/* Imágenes de la variante */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Imágenes de esta variante (Color: {color?.color || "N/A"})
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            Sube imágenes específicas de este teléfono en este color. Si no subes imágenes, se usarán las imágenes generales del producto.
                          </p>
                          <ImageUploader
                            images={variante.imagenes || []}
                            onImagesChange={(images) => handleUpdateVariantImages(index, images)}
                            maxImages={10}
                          />
                        </div>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div>
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
                      Precio (Q) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="new-variante-precio"
                      className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
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
                  onClick={handleAddVariant}
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
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

