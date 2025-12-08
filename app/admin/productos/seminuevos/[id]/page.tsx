"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";
import SeminuevoVarianteForm from "@/components/admin/SeminuevoVarianteForm";

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
  estado: number;
  precio: string;
  porcentajeBateria?: number | null;
  ciclosCarga?: number | null;
  stock: number;
}

interface TelefonoSeminuevoFormData {
  marcaId: string;
  modelo: string;
  precio: string;
  procesador: string;
  ram: string;
  mpxlsCamara: string;
  tamanoPantalla: string;
  tipoEntrada: string;
  descripcion: string;
}

export default function EditarTelefonoSeminuevoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<TelefonoSeminuevoFormData>({
    marcaId: "",
    modelo: "",
    precio: "",
    procesador: "",
    ram: "",
    mpxlsCamara: "",
    tamanoPantalla: "",
    tipoEntrada: "",
    descripcion: "",
  });

  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [esiPhone, setEsiPhone] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [marcasRes, coloresRes, telefonoRes] = await Promise.all([
          fetch("/api/admin/marcas"),
          fetch("/api/admin/colores"),
          fetch(`/api/admin/productos/seminuevos/${id}`),
        ]);

        if (!telefonoRes.ok) {
          throw new Error("Teléfono no encontrado");
        }

        const marcasData = await marcasRes.json();
        const coloresData = await coloresRes.json();
        const telefonoData = await telefonoRes.json();

        setMarcas(marcasData);
        setColores(coloresData);

        // Detectar si es iPhone
        const marcaSeleccionada = marcasData.find((m: Marca) => m.id === telefonoData.marcaId);
        const esiPhoneValue =
          marcaSeleccionada?.nombre.toLowerCase().includes("apple") ||
          marcaSeleccionada?.nombre.toLowerCase().includes("iphone");
        setEsiPhone(esiPhoneValue || false);

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
        });

        // Cargar variantes
        setVariantes(
          telefonoData.variantes.map((v: any) => ({
            id: v.id,
            colorId: v.colorId,
            rom: v.rom,
            estado: v.estado,
            precio: v.precio.toString(),
            porcentajeBateria: v.porcentajeBateria,
            ciclosCarga: v.ciclosCarga,
            stock: v.stock,
          }))
        );

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

  // Detectar si es iPhone cuando cambia la marca
  useEffect(() => {
    if (formData.marcaId) {
      const marcaSeleccionada = marcas.find((m) => m.id === parseInt(formData.marcaId));
      const esiPhoneValue =
        marcaSeleccionada?.nombre.toLowerCase().includes("apple") ||
        marcaSeleccionada?.nombre.toLowerCase().includes("iphone");
      setEsiPhone(esiPhoneValue || false);
    }
  }, [formData.marcaId, marcas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (variantes.length === 0) {
        setError("Debe crear al menos una variante");
        setSaving(false);
        return;
      }

      const variantesIncompletas = variantes.filter(
        (v) =>
          !v.colorId ||
          !v.rom ||
          !v.precio ||
          v.estado < 1 ||
          v.estado > 10 ||
          v.stock === undefined ||
          v.stock === null ||
          (esiPhone && (!v.porcentajeBateria || v.porcentajeBateria < 0 || v.porcentajeBateria > 100))
      );

      if (variantesIncompletas.length > 0) {
        setError("Todas las variantes deben tener todos los campos completos");
        setSaving(false);
        return;
      }

      const datosParaEnviar = {
        ...formData,
        variantes: variantes.map((v) => ({
          colorId: v.colorId,
          rom: v.rom,
          estado: v.estado,
          precio: v.precio,
          porcentajeBateria: esiPhone ? v.porcentajeBateria : null,
          ciclosCarga: esiPhone && v.ciclosCarga ? v.ciclosCarga : null,
          stock: v.stock,
        })),
        imagenes: imagenes,
      };

      const response = await fetch(`/api/admin/productos/seminuevos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaEnviar),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el teléfono");
      }

      router.push("/admin/productos/seminuevos");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
          href="/admin/productos/seminuevos"
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Volver a teléfonos seminuevos
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Editar Teléfono Seminuevo
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifica la información del teléfono seminuevo
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
                {esiPhone && (
                  <p className="mt-1 text-xs text-indigo-600">
                    ℹ️ iPhone detectado: Se requerirán campos de batería y ciclos de carga
                  </p>
                )}
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
                  Precio Base (Q) *
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
                <p className="mt-1 text-xs text-gray-500">
                  Precio base (cada variante puede tener su propio precio)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock Total
                </label>
                <input
                  type="number"
                  readOnly
                  value={
                    variantes.reduce((sum, v) => sum + (v.stock || 0), 0) || ""
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
              Variantes (Color + Almacenamiento + Estado + Precio + Batería)
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Cada variante puede tener diferente color, almacenamiento, estado (1-10), precio, porcentaje de batería y stock.
              {esiPhone && (
                <span className="block mt-1 text-indigo-600">
                  Para iPhone: El porcentaje de batería es obligatorio. Los ciclos de carga son opcionales.
                </span>
              )}
            </p>
          </div>
          <div className="px-6 py-4">
            <SeminuevoVarianteForm
              colores={colores}
              variantes={variantes}
              onVariantesChange={setVariantes}
              esiPhone={esiPhone}
            />
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
          <div className="px-6 py-4">
            <textarea
              rows={4}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/productos/seminuevos"
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

