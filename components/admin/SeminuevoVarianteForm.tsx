"use client";

import { useState, useEffect } from "react";
import ImageUploader from "@/components/admin/ImageUploader";

interface Color {
  id: number;
  color: string;
}

interface Variante {
  id?: number;
  colorId: number;
  rom: string;
  estado: number;
  precio: string;
  porcentajeBateria?: number | null;
  ciclosCarga?: number | null;
  stock: number;
  metodosPago?: string[] | null;
  imagenes?: string[]; // URLs de imágenes específicas de esta variante
}

interface SeminuevoVarianteFormProps {
  colores: Color[];
  variantes: Variante[];
  onVariantesChange: (variantes: Variante[]) => void;
  esiPhone: boolean;
}

export default function SeminuevoVarianteForm({
  colores,
  variantes,
  onVariantesChange,
  esiPhone,
}: SeminuevoVarianteFormProps) {
  const [newVariante, setNewVariante] = useState<Partial<Variante>>({
    colorId: 0,
    rom: "",
    estado: 10,
    precio: "",
    porcentajeBateria: null,
    ciclosCarga: null,
    stock: 0,
    metodosPago: [],
    imagenes: [],
  });

  const [mostrarCiclos, setMostrarCiclos] = useState(false);
  
  const METODOS_PAGO = [
    { value: "CONTRA_ENTREGA", label: "Contra Entrega" },
    { value: "TRANSFERENCIA", label: "Transferencia" },
    { value: "TARJETA", label: "Tarjeta" },
  ];

  const handleAddVariant = () => {
    if (!newVariante.colorId || !newVariante.rom || !newVariante.precio) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    if (esiPhone && (!newVariante.porcentajeBateria || newVariante.porcentajeBateria < 0 || newVariante.porcentajeBateria > 100)) {
      alert("El porcentaje de batería es requerido para iPhone (0-100)");
      return;
    }

    // Verificar si ya existe esta combinación
    const existe = variantes.some(
      (v) =>
        v.colorId === newVariante.colorId &&
        v.rom === newVariante.rom &&
        v.estado === newVariante.estado &&
        v.porcentajeBateria === newVariante.porcentajeBateria &&
        v.ciclosCarga === newVariante.ciclosCarga
    );

    if (existe) {
      alert("Esta variante ya existe");
      return;
    }

    onVariantesChange([
      ...variantes,
      {
        colorId: newVariante.colorId!,
        rom: newVariante.rom!,
        estado: newVariante.estado!,
        precio: newVariante.precio!,
        porcentajeBateria: esiPhone ? newVariante.porcentajeBateria : null,
        ciclosCarga: esiPhone && mostrarCiclos ? newVariante.ciclosCarga : null,
        stock: newVariante.stock || 0,
        metodosPago: newVariante.metodosPago && newVariante.metodosPago.length > 0 ? newVariante.metodosPago : null,
        imagenes: newVariante.imagenes || [],
      },
    ]);

    // Limpiar formulario
    setNewVariante({
      colorId: 0,
      rom: "",
      estado: 10,
      precio: "",
      porcentajeBateria: null,
      ciclosCarga: null,
      stock: 0,
      metodosPago: [],
      imagenes: [],
    });
    setMostrarCiclos(false);
  };

  const handleRemoveVariant = (index: number) => {
    onVariantesChange(variantes.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof Variante, value: any) => {
    const updated = [...variantes];
    updated[index] = { ...updated[index], [field]: value };
    onVariantesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Variantes del Producto
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Cada variante puede tener diferente color, almacenamiento, estado, precio, batería y stock.
        </p>

        {/* Lista de variantes existentes */}
        {variantes.length > 0 && (
          <div className="mt-3 space-y-2">
            {variantes.map((variante, index) => {
              const color = colores.find((c) => c.id === variante.colorId);
              const stableKey = variante.id
                ? `v-${variante.id}`
                : `new-${variante.colorId}-${variante.rom}-${variante.estado}-${variante.porcentajeBateria ?? 0}-${variante.ciclosCarga ?? 0}-${index}`;
              return (
                <div
                  key={stableKey}
                  className="rounded-md border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Color *</label>
                      <select
                        value={variante.colorId}
                        onChange={(e) =>
                          handleUpdateVariant(index, "colorId", parseInt(e.target.value))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                      >
                        <option value="0">Seleccionar</option>
                        {colores.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.color}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">ROM *</label>
                      <select
                        value={variante.rom}
                        onChange={(e) => handleUpdateVariant(index, "rom", e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
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
                      <label className="block text-xs font-medium text-gray-700">Estado (1-10) *</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={variante.estado}
                        onChange={(e) =>
                          handleUpdateVariant(index, "estado", parseInt(e.target.value) || 10)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Precio (Q) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variante.precio}
                        onChange={(e) => handleUpdateVariant(index, "precio", e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                      />
                    </div>
                    {esiPhone && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Batería % *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={variante.porcentajeBateria || ""}
                          onChange={(e) =>
                            handleUpdateVariant(
                              index,
                              "porcentajeBateria",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700">Stock *</label>
                        <input
                          type="number"
                          min="0"
                          value={variante.stock ?? 0}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === "" ? 0 : parseInt(raw, 10);
                            handleUpdateVariant(index, "stock", isNaN(val) ? 0 : Math.max(0, val));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="mt-6 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Métodos de Pago</label>
                    <div className="flex flex-wrap gap-2">
                      {METODOS_PAGO.map((metodo) => (
                        <label key={metodo.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(variante.metodosPago || []).includes(metodo.value)}
                            onChange={(e) => {
                              const current = variante.metodosPago || [];
                              const updated = e.target.checked
                                ? [...current, metodo.value]
                                : current.filter((m) => m !== metodo.value);
                              handleUpdateVariant(index, "metodosPago", updated.length > 0 ? updated : null);
                            }}
                            className="mr-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-700">{metodo.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {esiPhone && variante.ciclosCarga !== null && variante.ciclosCarga !== undefined && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">Ciclos de carga: {variante.ciclosCarga}</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Imágenes de la Variante (Fotos Reales)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Sube fotos reales de este teléfono específico. Si no subes imágenes, se usará la imagen de catálogo del modelo.
                    </p>
                    <ImageUploader
                      images={variante.imagenes || []}
                      onImagesChange={(imagenes) => handleUpdateVariant(index, "imagenes", imagenes)}
                      maxImages={5}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulario para agregar nueva variante */}
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Agregar Nueva Variante</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="block text-xs font-medium text-gray-700">Color *</label>
              <select
                value={newVariante.colorId || 0}
                onChange={(e) =>
                  setNewVariante({ ...newVariante, colorId: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
              >
                <option value="0">Seleccionar</option>
                {colores.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.color}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">ROM *</label>
              <select
                value={newVariante.rom || ""}
                onChange={(e) => setNewVariante({ ...newVariante, rom: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
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
              <label className="block text-xs font-medium text-gray-700">Estado (1-10) *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newVariante.estado || 10}
                onChange={(e) =>
                  setNewVariante({ ...newVariante, estado: parseInt(e.target.value) || 10 })
                }
                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Precio (Q) *</label>
              <input
                type="number"
                step="0.01"
                value={newVariante.precio || ""}
                onChange={(e) => setNewVariante({ ...newVariante, precio: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
              />
            </div>
            {esiPhone && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Batería % *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newVariante.porcentajeBateria || ""}
                    onChange={(e) =>
                      setNewVariante({
                        ...newVariante,
                        porcentajeBateria: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={mostrarCiclos}
                      onChange={(e) => setMostrarCiclos(e.target.checked)}
                      className="mr-1"
                    />
                    Agregar Ciclos
                  </label>
                  {mostrarCiclos && (
                    <input
                      type="number"
                      min="0"
                      value={newVariante.ciclosCarga || ""}
                      onChange={(e) =>
                        setNewVariante({
                          ...newVariante,
                          ciclosCarga: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
                      placeholder="Ciclos"
                    />
                  )}
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700">Stock *</label>
              <input
                type="number"
                min="0"
                value={newVariante.stock || 0}
                onChange={(e) =>
                  setNewVariante({ ...newVariante, stock: parseInt(e.target.value) || 0 })
                }
                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">Métodos de Pago</label>
            <div className="flex flex-wrap gap-2">
              {METODOS_PAGO.map((metodo) => (
                <label key={metodo.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(newVariante.metodosPago || []).includes(metodo.value)}
                    onChange={(e) => {
                      const current = newVariante.metodosPago || [];
                      const updated = e.target.checked
                        ? [...current, metodo.value]
                        : current.filter((m) => m !== metodo.value);
                      setNewVariante({ ...newVariante, metodosPago: updated });
                    }}
                    className="mr-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-700">{metodo.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Imágenes de la Variante (Fotos Reales) - Opcional
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Sube fotos reales de este teléfono específico. Si no subes imágenes, se usará la imagen de catálogo del modelo.
            </p>
            <ImageUploader
              images={newVariante.imagenes || []}
              onImagesChange={(imagenes) => setNewVariante({ ...newVariante, imagenes })}
              maxImages={5}
            />
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
  );
}

