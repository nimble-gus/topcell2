"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";

interface VarianteNuevo {
  id: number;
  colorId: number;
  color: string;
  rom: string;
  precio: number;
  stock: number;
  imagenes?: string[]; // Imágenes específicas de la variante (fotos del teléfono en ese color)
}

interface VarianteSeminuevo extends VarianteNuevo {
  estado: number;
  porcentajeBateria: number | null;
  ciclosCarga: number | null;
  imagenes?: string[]; // Imágenes específicas de la variante (fotos reales)
}

interface ProductDetailsProps {
  tipo: "telefono-nuevo" | "telefono-seminuevo" | "accesorio";
  varianteIdInicial?: number | null;
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

export default function ProductDetails({ tipo, varianteIdInicial, producto }: ProductDetailsProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedRom, setSelectedRom] = useState<string | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [selectedBateria, setSelectedBateria] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

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

  // Estado para mantener el ID de la variante seleccionada directamente (cuando viene de URL)
  const [varianteIdSeleccionada, setVarianteIdSeleccionada] = useState<number | null>(varianteIdInicial || null);

  // Encontrar la variante seleccionada
  const varianteSeleccionada = useMemo(() => {
    // Si hay un ID de variante seleccionada directamente, usarla
    if (varianteIdSeleccionada) {
      const variante = producto.variantes.find(v => v.id === varianteIdSeleccionada);
      if (variante) return variante;
    }

    // Si no, usar la lógica de selección por características
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
  }, [varianteIdSeleccionada, selectedColorId, selectedRom, selectedEstado, selectedBateria, producto.variantes, tipo]);

  // Precio a mostrar
  const precioMostrar = varianteSeleccionada
    ? varianteSeleccionada.precio
    : producto.precio;

  // Imágenes a mostrar: si la variante tiene imágenes, usar esas; si no, usar las del producto
  const imagenesAMostrar = useMemo(() => {
    if (varianteSeleccionada) {
      // Para teléfonos nuevos
      if (tipo === "telefono-nuevo") {
        const varianteNuevo = varianteSeleccionada as VarianteNuevo;
        // Si la variante tiene imágenes, usar esas; si no, usar las del producto
        if (varianteNuevo.imagenes && varianteNuevo.imagenes.length > 0) {
          return varianteNuevo.imagenes;
        }
      }
      // Para teléfonos seminuevos
      if (tipo === "telefono-seminuevo") {
        const varianteSemi = varianteSeleccionada as VarianteSeminuevo;
        // Si la variante tiene imágenes, usar esas; si no, usar las del modelo
        if (varianteSemi.imagenes && varianteSemi.imagenes.length > 0) {
          return varianteSemi.imagenes;
        }
      }
    }
    return producto.imagenes;
  }, [varianteSeleccionada, producto.imagenes, tipo]);

  // Resetear índice de imagen cuando cambian las imágenes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [imagenesAMostrar]);

  // Auto-seleccionar variante inicial si se proporciona
  useEffect(() => {
    if (varianteIdInicial) {
      const varianteInicial = producto.variantes.find(v => v.id === varianteIdInicial);
      if (varianteInicial) {
        // Establecer el ID de variante directamente para selección exacta
        setVarianteIdSeleccionada(varianteIdInicial);
        // También establecer los valores de selección para que la UI muestre los valores correctos
        setSelectedColorId(varianteInicial.colorId);
        setSelectedRom(varianteInicial.rom);
        if (tipo === "telefono-seminuevo") {
          const vSemi = varianteInicial as VarianteSeminuevo;
          setSelectedEstado(vSemi.estado);
          setSelectedBateria(vSemi.porcentajeBateria);
        }
        return; // No continuar con la auto-selección por defecto
      }
    }
    
    // Auto-seleccionar primera opción si hay variantes y no hay variante inicial
    if (coloresDisponibles.length > 0 && !selectedColorId) {
      setSelectedColorId(coloresDisponibles[0].id);
    }
  }, [varianteIdInicial, producto.variantes, coloresDisponibles, selectedColorId, tipo]);

  useEffect(() => {
    // Solo auto-seleccionar si no hay variante inicial
    if (varianteIdInicial) return;
    
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
  }, [capacidadesDisponibles, selectedRom, selectedColorId, tipo, varianteIdInicial]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagenesAMostrar.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagenesAMostrar.length) % imagenesAMostrar.length);
  };

  const handleColorSelect = (colorId: number) => {
    setVarianteIdSeleccionada(null); // Limpiar selección directa por ID
    setSelectedColorId(colorId);
    setSelectedRom(null);
    setSelectedEstado(null);
    setSelectedBateria(null);
  };

  const handleCapacidadSelect = (item: any) => {
    setVarianteIdSeleccionada(null); // Limpiar selección directa por ID
    if (tipo === "telefono-seminuevo") {
      setSelectedRom(item.rom);
      setSelectedEstado(item.estado);
      setSelectedBateria(item.porcentajeBateria);
    } else {
      setSelectedRom(item.rom);
    }
  };

  const handleAddToCart = () => {
    if (!varianteSeleccionada || varianteSeleccionada.stock === 0) return;
    
    setAddingToCart(true);
    
    // Encontrar el color seleccionado
    const colorSeleccionado = coloresDisponibles.find(c => c.id === selectedColorId);
    
    addToCart({
      tipo: tipo === "telefono-nuevo" ? "telefono-nuevo" : "telefono-seminuevo",
      productoId: producto.id,
      varianteId: varianteSeleccionada.id,
      cantidad: 1,
      precio: varianteSeleccionada.precio,
      modelo: producto.modelo,
      marca: producto.marca,
      imagen: imagenesAMostrar[0] || producto.imagenes[0] || "",
      color: colorSeleccionado?.color || "",
      rom: varianteSeleccionada.rom,
      estado: tipo === "telefono-seminuevo" ? (varianteSeleccionada as VarianteSeminuevo).estado : undefined,
      porcentajeBateria: tipo === "telefono-seminuevo" ? (varianteSeleccionada as VarianteSeminuevo).porcentajeBateria : undefined,
      ciclosCarga: tipo === "telefono-seminuevo" ? (varianteSeleccionada as VarianteSeminuevo).ciclosCarga : undefined,
    });
    
    setTimeout(() => {
      setAddingToCart(false);
      // Opcional: mostrar notificación o redirigir al carrito
      // router.push("/carrito");
    }, 500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={imagenesAMostrar[currentImageIndex] || "/placeholder-phone.jpg"}
              alt={`${producto.marca} ${producto.modelo}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            
            {imagenesAMostrar.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all"
                  aria-label="Imagen anterior"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
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
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all"
                  aria-label="Siguiente imagen"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
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
          {imagenesAMostrar.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imagenesAMostrar.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
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
        <div className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">{producto.marca}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{producto.modelo}</h1>
            <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-4 sm:mb-6">
              Q{precioMostrar.toLocaleString("es-GT")}
            </div>
          </div>

          {/* Selección de variantes */}
          {producto.variantes.length > 0 && (
            <div className="space-y-3 sm:space-y-4 border-t border-gray-200 pt-4 sm:pt-6">
              {/* Selección de color */}
              {coloresDisponibles.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {coloresDisponibles.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleColorSelect(color.id)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border-2 transition-all ${
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
                          className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm sm:text-base font-medium text-gray-900">
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
                                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                  Stock disponible: {variante.stock}
                                </div>
                              )}
                            </div>
                            <div className="text-base sm:text-lg font-bold text-orange-500">
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
            onClick={handleAddToCart}
            disabled={!varianteSeleccionada || varianteSeleccionada.stock === 0 || addingToCart}
            className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all ${
              varianteSeleccionada && varianteSeleccionada.stock > 0 && !addingToCart
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {addingToCart
              ? "Agregando..."
              : varianteSeleccionada && varianteSeleccionada.stock > 0
              ? "Agregar al carrito"
              : "Selecciona una variante"}
          </button>

          {/* Especificaciones técnicas */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Especificaciones Técnicas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Descripción</h2>
              <p className="text-sm sm:text-base text-gray-600 whitespace-pre-line">{producto.descripcion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

