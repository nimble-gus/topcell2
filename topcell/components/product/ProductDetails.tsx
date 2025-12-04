"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";

interface VarianteNuevo {
  id: number;
  colorId: number;
  color: string;
  rom: string;
  precio: number;
  stock: number;
}

interface VarianteSeminuevo extends VarianteNuevo {
  estado: number;
  porcentajeBateria: number | null;
  ciclosCarga: number | null;
}

interface ProductDetailsProps {
  tipo: "telefono-nuevo" | "telefono-seminuevo" | "accesorio";
  producto: {
    id: number;
    modelo: string;
    marca: string;
    marcaId: number;
    precio: number;
    procesador: string;
    ram: string;
    mpxlsCamara: string;
    tamanoPantalla: string;
    tipoEntrada: string;
    descripcion: string | null;
    imagenes: string[];
    variantes: VarianteNuevo[] | VarianteSeminuevo[];
  };
}

export default function ProductDetails({ tipo, producto }: ProductDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedRom, setSelectedRom] = useState<string | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [selectedBateria, setSelectedBateria] = useState<number | null>(null);

  // Obtener colores únicos disponibles
  const coloresDisponibles = useMemo(() => {
    const coloresMap = new Map<number, string>();
    producto.variantes.forEach((v) => {
      if (!coloresMap.has(v.colorId)) {
        coloresMap.set(v.colorId, v.color);
      }
    });
    return Array.from(coloresMap.entries()).map(([id, color]) => ({ id, color }));
  }, [producto.variantes]);

  // Obtener capacidades (ROM) disponibles según el color seleccionado
  const capacidadesDisponibles = useMemo(() => {
    if (!selectedColorId) return [];
    
    const capacidadesMap = new Map<string, boolean>();
    producto.variantes.forEach((v) => {
      if (v.colorId === selectedColorId) {
        if (tipo === "telefono-seminuevo") {
          const vSemi = v as VarianteSeminuevo;
          // Para seminuevos, agrupar por ROM, estado y batería
          const key = `${v.rom}-${vSemi.estado}-${vSemi.porcentajeBateria || "null"}`;
          if (!capacidadesMap.has(key)) {
            capacidadesMap.set(key, true);
          }
        } else {
          if (!capacidadesMap.has(v.rom)) {
            capacidadesMap.set(v.rom, true);
          }
        }
      }
    });
    
    if (tipo === "telefono-seminuevo") {
      // Para seminuevos, devolver variantes completas
      return producto.variantes
        .filter((v) => v.colorId === selectedColorId)
        .map((v) => {
          const vSemi = v as VarianteSeminuevo;
          return {
            rom: v.rom,
            estado: vSemi.estado,
            porcentajeBateria: vSemi.porcentajeBateria,
            variante: v,
          };
        });
    } else {
      return Array.from(capacidadesMap.keys()).map((rom) => ({ rom }));
    }
  }, [selectedColorId, producto.variantes, tipo]);

  // Encontrar la variante seleccionada
  const varianteSeleccionada = useMemo(() => {
    if (!selectedColorId || !selectedRom) return null;

    if (tipo === "telefono-seminuevo") {
      const vSemi = producto.variantes.find((v) => {
        const vs = v as VarianteSeminuevo;
        return (
          v.colorId === selectedColorId &&
          v.rom === selectedRom &&
          (selectedEstado === null || vs.estado === selectedEstado) &&
          (selectedBateria === null || vs.porcentajeBateria === selectedBateria)
        );
      }) as VarianteSeminuevo | undefined;
      return vSemi || null;
    } else {
      return producto.variantes.find(
        (v) => v.colorId === selectedColorId && v.rom === selectedRom
      ) || null;
    }
  }, [selectedColorId, selectedRom, selectedEstado, selectedBateria, producto.variantes, tipo]);

  // Precio a mostrar
  const precioMostrar = varianteSeleccionada
    ? varianteSeleccionada.precio
    : producto.precio;

  // Auto-seleccionar primera opción si hay variantes
  useEffect(() => {
    if (coloresDisponibles.length > 0 && !selectedColorId) {
      setSelectedColorId(coloresDisponibles[0].id);
    }
  }, [coloresDisponibles, selectedColorId]);

  useEffect(() => {
    if (capacidadesDisponibles.length > 0 && !selectedRom && selectedColorId) {
      if (tipo === "telefono-seminuevo") {
        const primera = capacidadesDisponibles[0] as any;
        setSelectedRom(primera.rom);
        setSelectedEstado(primera.estado);
        setSelectedBateria(primera.porcentajeBateria);
      } else {
        setSelectedRom(capacidadesDisponibles[0].rom);
      }
    }
  }, [capacidadesDisponibles, selectedRom, selectedColorId, tipo]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % producto.imagenes.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + producto.imagenes.length) % producto.imagenes.length);
  };

  const handleColorSelect = (colorId: number) => {
    setSelectedColorId(colorId);
    setSelectedRom(null);
    setSelectedEstado(null);
    setSelectedBateria(null);
  };

  const handleCapacidadSelect = (item: any) => {
    if (tipo === "telefono-seminuevo") {
      setSelectedRom(item.rom);
      setSelectedEstado(item.estado);
      setSelectedBateria(item.porcentajeBateria);
    } else {
      setSelectedRom(item.rom);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={producto.imagenes[currentImageIndex] || "/placeholder-phone.jpg"}
              alt={`${producto.marca} ${producto.modelo}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            
            {producto.imagenes.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
                  aria-label="Imagen anterior"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all"
                  aria-label="Siguiente imagen"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {producto.imagenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {producto.imagenes.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? "border-orange-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${producto.marca} ${producto.modelo} - Imagen ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{producto.marca}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{producto.modelo}</h1>
            <div className="text-4xl font-bold text-orange-500 mb-6">
              Q{precioMostrar.toLocaleString("es-GT")}
            </div>
          </div>

          {/* Selección de variantes */}
          {producto.variantes.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              {/* Selección de color */}
              {coloresDisponibles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {coloresDisponibles.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleColorSelect(color.id)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedColorId === color.id
                            ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {color.color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selección de capacidad y otras opciones */}
              {selectedColorId && capacidadesDisponibles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tipo === "telefono-seminuevo" ? "Opciones disponibles" : "Capacidad"}
                  </label>
                  <div className="space-y-2">
                    {capacidadesDisponibles.map((item, index) => {
                      const isSelected = tipo === "telefono-seminuevo"
                        ? selectedRom === item.rom && 
                          selectedEstado === (item as any).estado &&
                          selectedBateria === (item as any).porcentajeBateria
                        : selectedRom === item.rom;

                      const variante = tipo === "telefono-seminuevo" 
                        ? (item as any).variante as VarianteSeminuevo
                        : producto.variantes.find(
                            (v) => v.colorId === selectedColorId && v.rom === item.rom
                          ) as VarianteNuevo;

                      return (
                        <button
                          key={index}
                          onClick={() => handleCapacidadSelect(item)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.rom}
                                {tipo === "telefono-seminuevo" && (
                                  <>
                                    {" • "}Estado: {(item as any).estado}/10
                                    {(item as any).porcentajeBateria && (
                                      <>{" • "}Batería: {(item as any).porcentajeBateria}%</>
                                    )}
                                    {(item as any).variante.ciclosCarga && (
                                      <>{" • "}Ciclos: {(item as any).variante.ciclosCarga}</>
                                    )}
                                  </>
                                )}
                              </div>
                              {variante && variante.stock > 0 && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Stock disponible: {variante.stock}
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-bold text-orange-500">
                              Q{variante ? variante.precio.toLocaleString("es-GT") : "0"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock de la variante seleccionada */}
              {varianteSeleccionada && (
                <div className="text-sm text-gray-600">
                  {varianteSeleccionada.stock > 0 ? (
                    <span className="text-green-600 font-medium">
                      ✓ En stock ({varianteSeleccionada.stock} disponibles)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Sin stock</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botón de agregar al carrito */}
          <button
            disabled={!varianteSeleccionada || varianteSeleccionada.stock === 0}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              varianteSeleccionada && varianteSeleccionada.stock > 0
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {varianteSeleccionada && varianteSeleccionada.stock > 0
              ? "Agregar al carrito"
              : "Selecciona una variante"}
          </button>

          {/* Especificaciones técnicas */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Especificaciones Técnicas</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Procesador:</span>
                <span className="ml-2 font-medium text-gray-900">{producto.procesador}</span>
              </div>
              <div>
                <span className="text-gray-500">RAM:</span>
                <span className="ml-2 font-medium text-gray-900">{producto.ram}</span>
              </div>
              <div>
                <span className="text-gray-500">Cámara:</span>
                <span className="ml-2 font-medium text-gray-900">{producto.mpxlsCamara}</span>
              </div>
              <div>
                <span className="text-gray-500">Pantalla:</span>
                <span className="ml-2 font-medium text-gray-900">{producto.tamanoPantalla}</span>
              </div>
              <div>
                <span className="text-gray-500">Entrada:</span>
                <span className="ml-2 font-medium text-gray-900">{producto.tipoEntrada}</span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-600 whitespace-pre-line">{producto.descripcion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

