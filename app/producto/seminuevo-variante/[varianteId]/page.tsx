import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BuyButton from "@/components/product/BuyButton";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ varianteId: string }>;
}

export default async function SeminuevoVarianteDetailPage({ params }: PageProps) {
  const { varianteId: varianteIdParam } = await params;
  const varianteId = parseInt(varianteIdParam);

  if (isNaN(varianteId)) {
    notFound();
  }

  // Obtener la variante con toda su información
  const variante = await prisma.telefonoSeminuevoVariante.findUnique({
    where: { id: varianteId },
    include: {
      telefonoSeminuevo: {
        include: {
          marca: true,
          modelo: {
            include: {
              imagenes: {
                orderBy: { orden: "asc" },
              },
            },
          },
        },
      },
      color: true,
      imagenes: {
        orderBy: { orden: "asc" },
      },
    },
  });

  if (!variante || variante.stock === 0) {
    notFound();
  }

  const telefono = variante.telefonoSeminuevo;
  const esiPhone = telefono.marca.nombre.toLowerCase().includes("apple") || 
                   telefono.marca.nombre.toLowerCase().includes("iphone");

  // Obtener logo para el header
  const logoContent = await prisma.contenidoTienda.findFirst({
    where: {
      tipo: "logo",
      activo: true,
    },
    orderBy: {
      orden: "asc",
    },
  });

  // Obtener datos del footer
  const footerData = await prisma.contenidoTienda.findMany({
    where: {
      tipo: {
        in: [
          "footer-email",
          "footer-telefono",
          "footer-facebook",
          "footer-instagram",
          "footer-tiktok",
          "footer-servicio",
          "footer-link-conocenos",
          "footer-link-privacidad",
          "footer-link-terminos",
        ],
      },
      activo: true,
    },
    orderBy: [
      { tipo: "asc" },
      { orden: "asc" },
    ],
  });

  const footerEmail = footerData.find((item) => item.tipo === "footer-email")?.descripcion || null;
  const footerTelefono = footerData.find((item) => item.tipo === "footer-telefono")?.descripcion || null;
  const footerFacebook = footerData.find((item) => item.tipo === "footer-facebook")?.urlDestino || null;
  const footerInstagram = footerData.find((item) => item.tipo === "footer-instagram")?.urlDestino || null;
  const footerTiktok = footerData.find((item) => item.tipo === "footer-tiktok")?.urlDestino || null;
  const footerServicios = footerData
    .filter((item) => item.tipo === "footer-servicio")
    .map((item) => item.descripcion || "")
    .filter((s) => s.length > 0);
  const footerLinkConocenos = footerData.find((item) => item.tipo === "footer-link-conocenos")?.urlDestino || null;
  const footerLinkPrivacidad = footerData.find((item) => item.tipo === "footer-link-privacidad")?.urlDestino || null;
  const footerLinkTerminos = footerData.find((item) => item.tipo === "footer-link-terminos")?.urlDestino || null;

  // Obtener imágenes: priorizar imágenes de variante, luego del modelo
  const imagenes = variante.imagenes.length > 0 
    ? variante.imagenes.map(img => img.url)
    : (telefono.modelo?.imagenes.map(img => img.url) || []);

  // Parsear métodos de pago
  const parseMetodosPago = (metodosPago: any): string[] => {
    if (!metodosPago) return [];
    if (Array.isArray(metodosPago)) return metodosPago;
    try {
      const parsed = JSON.parse(metodosPago);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const metodosPago = parseMetodosPago(variante.metodosPago);
  const getMetodoPagoLabel = (metodo: string) => {
    const labels: { [key: string]: string } = {
      CONTRA_ENTREGA: "Contra Entrega",
      TRANSFERENCIA: "Transferencia",
      TARJETA: "Tarjeta",
    };
    return labels[metodo] || metodo;
  };

  // Función para obtener etiqueta de condición
  const getCondicionLabel = (estado: number): string => {
    if (estado >= 9) return "Excelente";
    if (estado >= 7) return "Muy Bueno";
    if (estado >= 5) return "Bueno";
    if (estado >= 3) return "Regular";
    return "Aceptable";
  };

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li>
                <Link href="/" className="hover:text-orange-500">
                  Inicio
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/seminuevos" className="hover:text-orange-500">
                  Seminuevos
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link 
                  href={`/seminuevos/${telefono.marca.nombre.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:text-orange-500"
                >
                  {telefono.marca.nombre}
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link 
                  href={`/seminuevos/${telefono.marca.nombre.toLowerCase().replace(/\s+/g, "-")}/${telefono.modelo?.nombre.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:text-orange-500"
                >
                  {telefono.modelo?.nombre}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Detalle</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda: Galería de imágenes */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {telefono.marca.nombre} {telefono.modelo?.nombre} {variante.color.color}
                  </h2>
                  
                  {/* Galería de imágenes */}
                  {imagenes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {imagenes.slice(0, 6).map((url, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={url}
                            alt={`${telefono.marca.nombre} ${telefono.modelo?.nombre} - Imagen ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">Sin imágenes disponibles</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información técnica */}
              <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Especificaciones Técnicas</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Procesador:</span>
                      <span className="ml-2 text-gray-900">{telefono.procesador}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">RAM:</span>
                      <span className="ml-2 text-gray-900">{telefono.ram}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Cámara:</span>
                      <span className="ml-2 text-gray-900">{telefono.mpxlsCamara} MP</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Pantalla:</span>
                      <span className="ml-2 text-gray-900">{telefono.tamanoPantalla}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tipo de Entrada:</span>
                      <span className="ml-2 text-gray-900">{telefono.tipoEntrada}</span>
                    </div>
                    {telefono.descripcion && (
                      <div className="col-span-2">
                        <span className="text-sm font-medium text-gray-600">Descripción:</span>
                        <p className="mt-1 text-gray-900">{telefono.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Precio y acción */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
                <div className="p-6">
                  {/* Precio destacado */}
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-orange-500 mb-2">
                      Q{Number(variante.precio).toLocaleString("es-GT")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {variante.stock > 0 ? (
                        <span className="text-green-600 font-medium">{variante.stock} disponible{variante.stock !== 1 ? "s" : ""}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Agotado</span>
                      )}
                    </div>
                  </div>

                  {/* Botón Comprar Ahora */}
                  <BuyButton
                    tipo="telefono-seminuevo"
                    productoId={telefono.id}
                    varianteId={variante.id}
                    precio={Number(variante.precio)}
                    stock={variante.stock}
                    modelo={telefono.modelo?.nombre || ""}
                    marca={telefono.marca.nombre}
                    imagen={imagenes[0] || ""}
                    color={variante.color.color}
                    rom={variante.rom}
                    estado={variante.estado}
                    porcentajeBateria={variante.porcentajeBateria}
                    ciclosCarga={variante.ciclosCarga}
                  />

                  {/* Información del producto */}
                  <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Condición:</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {getCondicionLabel(variante.estado)} ({variante.estado}/10)
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-600">Color:</span>
                      <div className="mt-1 flex items-center">
                        <div
                          className="h-6 w-6 rounded-full border border-gray-300 mr-2"
                          style={{ backgroundColor: variante.color.color.toLowerCase() }}
                        />
                        <span className="text-gray-900">{variante.color.color}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-600">Almacenamiento:</span>
                      <span className="ml-2 text-gray-900">{variante.rom}</span>
                    </div>

                    {esiPhone && variante.porcentajeBateria !== null && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Salud de Batería:</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {variante.porcentajeBateria}%
                          </span>
                        </div>
                        {variante.ciclosCarga !== null && (
                          <p className="mt-1 text-xs text-gray-500">
                            Ciclos de carga: {variante.ciclosCarga}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-medium text-gray-600">Métodos de Pago:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {metodosPago.length > 0 ? (
                          metodosPago.map((metodo) => (
                            <span
                              key={metodo}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {getMetodoPagoLabel(metodo)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-600">Todos los métodos disponibles</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer
        logoUrl={logoContent?.url || null}
        email={footerEmail}
        telefono={footerTelefono}
        facebookUrl={footerFacebook}
        instagramUrl={footerInstagram}
        tiktokUrl={footerTiktok}
        servicios={footerServicios}
        linkConocenos={footerLinkConocenos}
        linkPrivacidad={footerLinkPrivacidad}
        linkTerminos={footerLinkTerminos}
      />
    </div>
  );
}
