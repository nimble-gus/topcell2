import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function SeminuevosPage() {
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

  // Obtener teléfonos seminuevos agrupados por marca
  const telefonos = await prisma.telefonoSeminuevo.findMany({
    where: { activo: true },
    include: {
      marca: true,
      modelo: {
        include: {
          imagenes: {
            orderBy: { orden: "asc" },
            take: 1,
          },
        },
      },
      variantes: {
        where: {
          stock: { gt: 0 },
        },
      },
    },
    orderBy: [
      { marca: { nombre: "asc" } },
      { modelo: { nombre: "asc" } },
    ],
  });

  // Agrupar por marca
  const telefonosPorMarca = telefonos.reduce((acc: any, telefono) => {
    const marcaNombre = telefono.marca.nombre;
    if (!acc[marcaNombre]) {
      acc[marcaNombre] = {
        marca: {
          id: telefono.marca.id,
          nombre: telefono.marca.nombre,
          logoUrl: telefono.marca.logoUrl,
        },
        modelos: [],
      };
    }
    
    // Solo incluir si tiene variantes con stock
    if (telefono.variantes.length > 0) {
      const precioMinimo = Math.min(...telefono.variantes.map(v => Number(v.precio)));
      acc[marcaNombre].modelos.push({
        id: telefono.id,
        modelo: telefono.modelo.nombre,
        modeloId: telefono.modelo.id,
        imagenUrl: telefono.modelo.imagenes[0]?.url || null,
        precioMinimo,
      });
    }
    
    return acc;
  }, {});

  const marcasConModelos = Object.values(telefonosPorMarca) as any[];

  // Función para crear slug
  const createSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, "-");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Teléfonos Seminuevos
            </h1>
            <p className="text-gray-600">
              Encuentra el teléfono seminuevo perfecto para ti
            </p>
          </div>

          {marcasConModelos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay teléfonos seminuevos disponibles en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {marcasConModelos.map((grupo) => (
                <div key={grupo.marca.id} className="border-b border-gray-200 pb-12 last:border-b-0">
                  {/* Logo de la marca */}
                  <div className="mb-6">
                    {grupo.marca.logoUrl ? (
                      <div className="relative h-12 w-32">
                        <Image
                          src={grupo.marca.logoUrl}
                          alt={grupo.marca.nombre}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900">
                        {grupo.marca.nombre}
                      </h2>
                    )}
                  </div>

                  {/* Grid de modelos */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {grupo.modelos.map((modelo: any) => (
                      <Link
                        key={modelo.id}
                        href={`/seminuevos/${createSlug(grupo.marca.nombre)}/${createSlug(modelo.modelo)}`}
                        className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]"
                      >
                        {/* Imagen del producto */}
                        {modelo.imagenUrl ? (
                          <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                            <Image
                              src={modelo.imagenUrl}
                              alt={modelo.modelo}
                              fill
                              className="object-cover transition-transform group-hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Sin imagen</span>
                          </div>
                        )}

                        {/* Información del producto */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                            {modelo.modelo}
                          </h3>
                          <p className="text-xl font-bold text-orange-500">
                            Desde Q{modelo.precioMinimo.toLocaleString("es-GT")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
