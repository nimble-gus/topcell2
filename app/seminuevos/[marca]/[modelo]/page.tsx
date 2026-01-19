import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ marca: string; modelo: string }>;
}

export default async function SeminuevoModeloPage({ params }: PageProps) {
  const { marca: marcaSlug, modelo: modeloSlug } = await params;
  
  // Decodificar los slugs y normalizar (primera letra mayúscula)
  const marcaNombreRaw = decodeURIComponent(marcaSlug).replace(/-/g, " ");
  const modeloNombreRaw = decodeURIComponent(modeloSlug).replace(/-/g, " ");
  
  // Normalizar: primera letra mayúscula, resto minúsculas
  const marcaNombre = marcaNombreRaw.charAt(0).toUpperCase() + marcaNombreRaw.slice(1).toLowerCase();
  const modeloNombre = modeloNombreRaw.charAt(0).toUpperCase() + modeloNombreRaw.slice(1).toLowerCase();

  // Obtener logo
  const logoContent = await prisma.contenidoTienda.findFirst({
    where: {
      tipo: "logo",
      activo: true,
    },
    orderBy: {
      orden: "asc",
    },
  });

  // Obtener footer content
  const footerContent = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "footer",
      activo: true,
    },
  });

  const footerEmail = footerContent.find((c) => c.descripcion === "email")?.urlDestino || null;
  const footerTelefono = footerContent.find((c) => c.descripcion === "telefono")?.urlDestino || null;
  const footerFacebook = footerContent.find((c) => c.descripcion === "facebook")?.urlDestino || null;
  const footerInstagram = footerContent.find((c) => c.descripcion === "instagram")?.urlDestino || null;
  const footerTiktok = footerContent.find((c) => c.descripcion === "tiktok")?.urlDestino || null;
  const footerServicios = footerContent.filter((c) => c.descripcion?.startsWith("servicio_"));
  const footerLinkConocenos = footerContent.find((c) => c.descripcion === "link_conocenos")?.urlDestino || null;
  const footerLinkPrivacidad = footerContent.find((c) => c.descripcion === "link_privacidad")?.urlDestino || null;
  const footerLinkTerminos = footerContent.find((c) => c.descripcion === "link_terminos")?.urlDestino || null;

  // Obtener TODOS los teléfonos seminuevos de este modelo
  const telefonos = await prisma.telefonoSeminuevo.findMany({
    where: {
      activo: true,
      marca: {
        nombre: {
          equals: marcaNombre,
        },
      },
      modelo: {
        nombre: {
          equals: modeloNombre,
        },
      },
    },
    include: {
      marca: true,
      modelo: {
        include: {
          imagenes: {
            orderBy: { orden: "asc" },
          },
        },
      },
      variantes: {
        where: {
          stock: { gt: 0 },
        },
        include: {
          color: true,
          imagenes: {
            orderBy: { orden: "asc" },
          },
        },
        orderBy: [
          { precio: "asc" },
          { estado: "desc" },
        ],
      },
    },
  });

  // Crear un array plano de todas las variantes con información del teléfono padre
  const todasLasVariantes = telefonos.flatMap((telefono) =>
    telefono.variantes.map((variante) => ({
      ...variante,
      telefonoId: telefono.id,
      marca: telefono.marca,
      modelo: telefono.modelo,
      procesador: telefono.procesador,
      ram: telefono.ram,
      mpxlsCamara: telefono.mpxlsCamara,
      tamanoPantalla: telefono.tamanoPantalla,
      tipoEntrada: telefono.tipoEntrada,
      descripcion: telefono.descripcion,
    }))
  );

  if (todasLasVariantes.length === 0) {
    notFound();
  }

  // Ordenar todas las variantes por precio
  todasLasVariantes.sort((a, b) => Number(a.precio) - Number(b.precio));

  const esiPhone = telefonos[0]?.marca.nombre.toLowerCase().includes("apple") || 
                   telefonos[0]?.marca.nombre.toLowerCase().includes("iphone");
  
  const modeloInfo = telefonos[0]?.modelo;
  const marcaInfo = telefonos[0]?.marca;

  // Función para obtener etiqueta de método de pago
  const getMetodoPagoLabel = (metodo: string) => {
    const labels: { [key: string]: string } = {
      CONTRA_ENTREGA: "Contra Entrega",
      TRANSFERENCIA: "Transferencia",
      TARJETA: "Tarjeta",
    };
    return labels[metodo] || metodo;
  };

  // Función para parsear metodosPago (puede venir como JSON string o array)
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
                <Link href={`/seminuevos/${marcaSlug}`} className="hover:text-orange-500">
                  {marcaInfo?.nombre}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{modeloInfo?.nombre}</li>
            </ol>
          </nav>

          {/* Encabezado del modelo */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {modeloInfo?.imagenes && modeloInfo.imagenes.length > 0 && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={modeloInfo.imagenes[0].url}
                    alt={modeloInfo.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {marcaInfo?.nombre} {modeloInfo?.nombre}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Desde Q{Number(todasLasVariantes[0]?.precio || 0).toLocaleString("es-GT")}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Mostrando {todasLasVariantes.length} teléfono{todasLasVariantes.length !== 1 ? "s" : ""} disponible{todasLasVariantes.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Tabla de variantes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                Teléfonos Disponibles
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Almacenamiento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    {esiPhone && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batería
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ciclos
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Métodos de Pago
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todasLasVariantes.map((variante) => {
                    const metodosPago = parseMetodosPago(variante.metodosPago);
                    // Obtener imagen: priorizar imagen de variante, luego imagen del modelo
                    const imagenVariante = variante.imagenes && variante.imagenes.length > 0 
                      ? variante.imagenes[0].url 
                      : null;
                    const imagenModelo = modeloInfo?.imagenes && modeloInfo.imagenes.length > 0
                      ? modeloInfo.imagenes[0].url
                      : null;
                    const imagenMostrar = imagenVariante || imagenModelo;
                    
                    return (
                      <tr key={variante.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {imagenMostrar ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={imagenMostrar}
                                alt={`${marcaInfo?.nombre} ${modeloInfo?.nombre} ${variante.color.color}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-400">Sin foto</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-orange-500">
                            Q{Number(variante.precio).toLocaleString("es-GT")}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="h-5 w-5 rounded-full border border-gray-300 mr-2 flex-shrink-0"
                              style={{ backgroundColor: variante.color.color.toLowerCase() }}
                            />
                            <span className="text-sm text-gray-900">{variante.color.color}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {variante.rom}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {variante.estado}/10
                          </span>
                        </td>
                        {esiPhone && (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variante.porcentajeBateria !== null ? `${variante.porcentajeBateria}%` : "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variante.ciclosCarga !== null ? variante.ciclosCarga : "-"}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            variante.stock > 0 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {variante.stock}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {metodosPago.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {metodosPago.map((metodo) => (
                                <span
                                  key={metodo}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {getMetodoPagoLabel(metodo)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Todos</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/producto/seminuevo-variante/${variante.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                          >
                            Ver Detalles
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
