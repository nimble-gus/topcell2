"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ItemOrden {
  id: number;
  tipoProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
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
  items: ItemOrden[];
}

export default function OrdenConfirmacionPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = params.id as string;
  
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverData, setServerData] = useState<{
    logoUrl: string | null;
    footerEmail: string | null;
    footerTelefono: string | null;
    footerFacebook: string | null;
    footerInstagram: string | null;
    footerTiktok: string | null;
    footerServicios: string[];
    footerLinkConocenos: string | null;
    footerLinkPrivacidad: string | null;
    footerLinkTerminos: string | null;
  } | null>(null);

  useEffect(() => {
    loadOrden();
    loadServerData();
  }, [ordenId]);

  const loadOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${ordenId}`);
      if (!response.ok) {
        throw new Error("Orden no encontrada");
      }
      const data = await response.json();
      setOrden(data);
    } catch (error: any) {
      console.error("Error al cargar orden:", error);
      setError(error.message || "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const loadServerData = async () => {
    try {
      const response = await fetch("/api/contenido");
      if (response.ok) {
        const data = await response.json();
        const logoContent = data.find((item: any) => item.tipo === "logo" && item.activo);
        const footerData = data.filter((item: any) => 
          ["footer-email", "footer-telefono", "footer-facebook", "footer-instagram", 
           "footer-tiktok", "footer-servicio", "footer-link-conocenos", 
           "footer-link-privacidad", "footer-link-terminos"].includes(item.tipo) && item.activo
        );

        const footerEmail = footerData.find((item: any) => item.tipo === "footer-email")?.descripcion || null;
        const footerTelefono = footerData.find((item: any) => item.tipo === "footer-telefono")?.descripcion || null;
        const footerFacebook = footerData.find((item: any) => item.tipo === "footer-facebook")?.urlDestino || null;
        const footerInstagram = footerData.find((item: any) => item.tipo === "footer-instagram")?.urlDestino || null;
        const footerTiktok = footerData.find((item: any) => item.tipo === "footer-tiktok")?.urlDestino || null;
        const footerServicios = footerData
          .filter((item: any) => item.tipo === "footer-servicio")
          .map((item: any) => item.descripcion || "")
          .filter((s: string) => s.length > 0);
        const footerLinkConocenos = footerData.find((item: any) => item.tipo === "footer-link-conocenos")?.urlDestino || null;
        const footerLinkPrivacidad = footerData.find((item: any) => item.tipo === "footer-link-privacidad")?.urlDestino || null;
        const footerLinkTerminos = footerData.find((item: any) => item.tipo === "footer-link-terminos")?.urlDestino || null;

        setServerData({
          logoUrl: logoContent?.url || null,
          footerEmail,
          footerTelefono,
          footerFacebook,
          footerInstagram,
          footerTiktok,
          footerServicios,
          footerLinkConocenos,
          footerLinkPrivacidad,
          footerLinkTerminos,
        });
      }
    } catch (error) {
      console.error("Error al cargar datos del servidor:", error);
    }
  };

  if (loading || !serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={serverData.logoUrl} />
        <div className="pt-16 sm:pt-20 pb-8 sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {error || "Orden no encontrada"}
              </h2>
              <p className="text-gray-600 mb-6">
                No pudimos encontrar la orden solicitada.
              </p>
              <Link
                href="/catalogo"
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Ir al Catálogo
              </Link>
            </div>
          </div>
        </div>
        <Footer
          logoUrl={serverData.logoUrl}
          email={serverData.footerEmail}
          telefono={serverData.footerTelefono}
          facebookUrl={serverData.footerFacebook}
          instagramUrl={serverData.footerInstagram}
          tiktokUrl={serverData.footerTiktok}
          servicios={serverData.footerServicios}
          linkConocenos={serverData.footerLinkConocenos}
          linkPrivacidad={serverData.footerLinkPrivacidad}
          linkTerminos={serverData.footerLinkTerminos}
        />
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

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={serverData.logoUrl} />
      
      <main className="pt-20 pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Mensaje de éxito */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-gray-600">
              Gracias por tu compra. Hemos recibido tu pedido y te contactaremos pronto.
            </p>
          </div>

          {/* Información de la orden */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Número de Orden
                </h2>
                <p className="text-2xl font-bold text-orange-500">
                  {orden.numeroOrden}
                </p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-sm text-gray-500 mb-1">Fecha del pedido</p>
                <p className="text-sm font-medium text-gray-900">{fechaOrden}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Estado:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  orden.estado === "PENDIENTE"
                    ? "bg-yellow-100 text-yellow-800"
                    : orden.estado === "PROCESANDO"
                    ? "bg-blue-100 text-blue-800"
                    : orden.estado === "ENVIADO"
                    ? "bg-purple-100 text-purple-800"
                    : orden.estado === "ENTREGADO"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {orden.estado}
                </span>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Productos Pedidos
            </h2>
            
            <div className="space-y-4">
              {orden.items.map((item) => {
                const producto = item.telefonoNuevo || item.telefonoSeminuevo || item.accesorio;
                const imagen = producto?.imagenes[0]?.url || "/placeholder-phone.jpg";
                const marca = producto?.marca.nombre || "";
                const modelo = producto?.modelo || "";

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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {modelo}
                      </h3>
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


          {/* Resumen de totales */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resumen de Totales
            </h2>
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

          {/* Notas */}
          {orden.notas && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Notas Adicionales
              </h2>
              <p className="text-gray-700 whitespace-pre-line">{orden.notas}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/catalogo"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Continuar Comprando
            </Link>
            <button
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Imprimir Confirmación
            </button>
          </div>
        </div>
      </main>

      <Footer
        logoUrl={serverData.logoUrl}
        email={serverData.footerEmail}
        telefono={serverData.footerTelefono}
        facebookUrl={serverData.footerFacebook}
        instagramUrl={serverData.footerInstagram}
        tiktokUrl={serverData.footerTiktok}
        servicios={serverData.footerServicios}
        linkConocenos={serverData.footerLinkConocenos}
        linkPrivacidad={serverData.footerLinkPrivacidad}
        linkTerminos={serverData.footerLinkTerminos}
      />
    </div>
  );
}

