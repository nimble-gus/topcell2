"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface DetallesVariante {
  color?: string;
  rom?: string;
  estado?: number | null;
  porcentajeBateria?: number | null;
  ciclosCarga?: number | null;
}

interface ItemOrden {
  id: number;
  tipoProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  detallesVariante: string | null;
  telefonoNuevo?: {
    id: number;
    modelo: string;
    marca: {
      nombre: string;
    };
    imagenes: Array<{ url: string }>;
  };
  telefonoSeminuevo?: {
    id: number;
    modelo: string;
    marca: {
      nombre: string;
    };
    imagenes: Array<{ url: string }>;
  };
  accesorio?: {
    id: number;
    modelo: string;
    marca: {
      nombre: string;
    };
    imagenes: Array<{ url: string }>;
  };
}

interface Orden {
  id: number;
  numeroOrden: string;
  estado: string;
  estadoPago: string | null;
  subtotal: number;
  impuestos: number;
  envio: number;
  total: number;
  tipoEnvio: string;
  metodoPago: string;
  direccionEnvio: string;
  ciudadEnvio: string | null;
  codigoPostalEnvio: string | null;
  nombreRecibe: string | null;
  telefonoRecibe: string | null;
  boletaPagoUrl: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string | null;
    email: string;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
  };
  items: ItemOrden[];
}

export default function DetalleOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = params.id as string;

  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newEstado, setNewEstado] = useState("");

  useEffect(() => {
    loadOrden();
  }, [ordenId]);

  const loadOrden = async () => {
    try {
      const response = await fetch(`/api/admin/ordenes/${ordenId}`);
      if (!response.ok) {
        throw new Error("Orden no encontrada");
      }
      const data = await response.json();
      setOrden(data);
      setNewEstado(data.estado);
    } catch (error: any) {
      console.error("Error al cargar orden:", error);
      setError(error.message || "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async () => {
    if (!newEstado || newEstado === orden?.estado) return;

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/ordenes/${ordenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: newEstado }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el estado");
      }

      // Recargar la orden
      await loadOrden();
    } catch (error: any) {
      console.error("Error al actualizar estado:", error);
      setError(error.message || "Error al actualizar el estado");
    } finally {
      setUpdating(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESANDO":
        return "bg-blue-100 text-blue-800";
      case "ENVIADO":
        return "bg-purple-100 text-purple-800";
      case "ENTREGADO":
        return "bg-green-100 text-green-800";
      case "CANCELADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  if (error && !orden) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <Link
          href="/admin/ordenes"
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Volver a Órdenes
        </Link>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="p-6">
        <p>Orden no encontrada</p>
        <Link
          href="/admin/ordenes"
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Volver a Órdenes
        </Link>
      </div>
    );
  }

  const fechaOrden = new Date(orden.createdAt).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const estados = ["PENDIENTE", "PROCESANDO", "ENVIADO", "ENTREGADO", "CANCELADO"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/ordenes"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Volver a Órdenes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orden #{orden.numeroOrden}</h1>
            <p className="text-sm text-gray-500 mt-1">Creada el {fechaOrden}</p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(orden.estado)}`}
            >
              {orden.estado}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del cliente */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">
                  {orden.usuario.nombre} {orden.usuario.apellido || ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{orden.usuario.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{orden.usuario.telefono || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ciudad</p>
                <p className="font-medium text-gray-900">{orden.usuario.ciudad || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dirección de Envío</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Tipo:</span>{" "}
                {orden.tipoEnvio === "ENVIO" ? "Envío a domicilio" : "Recoger en bodega"}
              </p>
              <p className="text-gray-700">{orden.direccionEnvio}</p>
              {orden.ciudadEnvio && <p className="text-gray-700">{orden.ciudadEnvio}</p>}
              {orden.codigoPostalEnvio && (
                <p className="text-gray-700">Código Postal: {orden.codigoPostalEnvio}</p>
              )}
              {orden.nombreRecibe && (
                <p className="text-gray-700">
                  <span className="font-medium">Recibe:</span> {orden.nombreRecibe}
                </p>
              )}
              {orden.telefonoRecibe && (
                <p className="text-gray-700">
                  <span className="font-medium">Teléfono de contacto:</span> {orden.telefonoRecibe}
                </p>
              )}
            </div>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Método de Pago</h2>
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Tipo:</span>{" "}
              {orden.metodoPago === "CONTRA_ENTREGA" 
                ? "Pago Contra Entrega" 
                : orden.metodoPago === "TARJETA"
                ? "Pago con Tarjeta"
                : "Transferencia"}
            </p>
            {orden.boletaPagoUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Boleta de Pago:</p>
                <a
                  href={orden.boletaPagoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src={orden.boletaPagoUrl}
                    alt="Boleta de pago"
                    width={200}
                    height={200}
                    className="rounded-lg border border-gray-200"
                  />
                </a>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Productos</h2>
            <div className="space-y-4">
              {orden.items.map((item) => {
                const producto = item.telefonoNuevo || item.telefonoSeminuevo || item.accesorio;
                const imagen = producto?.imagenes[0]?.url || "/placeholder-phone.jpg";
                const marca = producto?.marca.nombre || "";
                const modelo = producto?.modelo || "";
                
                // Parsear detalles de la variante
                let detalles: DetallesVariante | null = null;
                if (item.detallesVariante) {
                  try {
                    detalles = JSON.parse(item.detallesVariante);
                  } catch (e) {
                    console.error("Error al parsear detallesVariante:", e);
                  }
                }

                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imagen}
                        alt={`${marca} ${modelo}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">{marca}</p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{modelo}</h3>
                      
                      {/* Detalles de la variante */}
                      {detalles && (
                        <div className="mb-2 space-y-1">
                          {detalles.color && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Color:</span> {detalles.color}
                            </p>
                          )}
                          {detalles.rom && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Capacidad:</span> {detalles.rom}
                            </p>
                          )}
                          {detalles.estado !== null && detalles.estado !== undefined && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Estado:</span> {detalles.estado}/10
                            </p>
                          )}
                          {detalles.porcentajeBateria !== null && detalles.porcentajeBateria !== undefined && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Batería:</span> {detalles.porcentajeBateria}%
                            </p>
                          )}
                          {detalles.ciclosCarga !== null && detalles.ciclosCarga !== undefined && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Ciclos de carga:</span> {detalles.ciclosCarga}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-end">
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.cantidad} × Q{Number(item.precioUnitario).toLocaleString("es-GT")}
                        </p>
                        <p className="text-lg font-bold text-orange-500">
                          Q{Number(item.subtotal).toLocaleString("es-GT")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          {orden.notas && (
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notas Adicionales</h2>
              <p className="text-gray-700 whitespace-pre-line">{orden.notas}</p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resumen de totales */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900">
                  Q{Number(orden.subtotal).toLocaleString("es-GT")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envío:</span>
                <span className="font-semibold text-gray-900">
                  {Number(orden.envio) === 0 ? "Gratis" : `Q${Number(orden.envio).toLocaleString("es-GT")}`}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-orange-500">
                    Q{Number(orden.total).toLocaleString("es-GT")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descargar Voucher */}
          {(orden.metodoPago === "TARJETA" && (orden.estadoPago === "APROBADO" || orden.estadoPago === "ANULADO")) ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Comprobante de Pago</h2>
              <button
                onClick={() => {
                  window.open(`/api/ordenes/${ordenId}/voucher`, "_blank");
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Descargar Voucher
              </button>
            </div>
          ) : null}

          {/* Cambiar estado */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cambiar Estado</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado
                </label>
                <select
                  id="estado"
                  value={newEstado}
                  onChange={(e) => setNewEstado(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {estados.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleUpdateEstado}
                disabled={updating || newEstado === orden.estado}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? "Actualizando..." : "Actualizar Estado"}
              </button>
              {newEstado === "CANCELADO" && orden.estado !== "CANCELADO" && (
                <p className="text-xs text-yellow-600">
                  ⚠️ Al cancelar, el stock de los productos será restaurado automáticamente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

