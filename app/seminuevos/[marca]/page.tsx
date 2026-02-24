import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ marca: string }>;
}

export default async function SeminuevosMarcaPage({ params }: PageProps) {
  const { marca: marcaSlug } = await params;

  const marcaNombreRaw = decodeURIComponent(marcaSlug).replace(/-/g, " ");
  const marcaNombre = marcaNombreRaw.charAt(0).toUpperCase() + marcaNombreRaw.slice(1).toLowerCase();

  const createSlug = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "-");

  // Logo y footer
  const logoContent = await prisma.contenidoTienda.findFirst({
    where: { tipo: "logo", activo: true },
    orderBy: { orden: "asc" },
  });

  const footerContent = await prisma.contenidoTienda.findMany({
    where: { tipo: "footer", activo: true },
  });
  const footerEmail = footerContent.find((c) => c.descripcion === "email")?.urlDestino || null;
  const footerTelefono = footerContent.find((c) => c.descripcion === "telefono")?.urlDestino || null;
  const footerFacebook = footerContent.find((c) => c.descripcion === "facebook")?.urlDestino || null;
  const footerInstagram = footerContent.find((c) => c.descripcion === "instagram")?.urlDestino || null;
  const footerTiktok = footerContent.find((c) => c.descripcion === "tiktok")?.urlDestino || null;
  const footerServicios = footerContent
    .filter((c) => c.descripcion?.startsWith("servicio_"))
    .map((c) => c.url);
  const footerLinkConocenos = footerContent.find((c) => c.descripcion === "link_conocenos")?.urlDestino || null;
  const footerLinkPrivacidad = footerContent.find((c) => c.descripcion === "link_privacidad")?.urlDestino || null;
  const footerLinkTerminos = footerContent.find((c) => c.descripcion === "link_terminos")?.urlDestino || null;

  const telefonos = await prisma.telefonoSeminuevo.findMany({
    where: {
      activo: true,
      marca: { nombre: marcaNombre },
    },
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
        where: { stock: { gt: 0 } },
      },
    },
    orderBy: [{ modelo: { nombre: "asc" } }],
  });

  // Deduplicar por modelo (misma lógica que la página principal)
  const porModelo = new Map<
    string,
    { marca: any; id: number; modelo: string; modeloId: number; imagenUrl: string | null; precioMinimo: number }
  >();
  for (const telefono of telefonos) {
    if (telefono.variantes.length === 0) continue;
    const modeloNombre = telefono.modelo?.nombre || "Sin modelo";
    const key = modeloNombre;
    const precioMin = Math.min(...telefono.variantes.map((v) => Number(v.precio)));
    const existente = porModelo.get(key);
    if (!existente || precioMin < existente.precioMinimo) {
      porModelo.set(key, {
        marca: { id: telefono.marca.id, nombre: telefono.marca.nombre, logoUrl: telefono.marca.logoUrl },
        id: telefono.id,
        modelo: modeloNombre,
        modeloId: telefono.modelo?.id || 0,
        imagenUrl: telefono.modelo?.imagenes?.[0]?.url || null,
        precioMinimo: precioMin,
      });
    }
  }

  const modelos = Array.from(porModelo.values());

  if (modelos.length === 0) {
    notFound();
  }

  const marcaInfo = modelos[0]?.marca;

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />

      <main className="pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li>
                <Link href="/" className="hover:text-orange-500">Inicio</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/seminuevos" className="hover:text-orange-500">Seminuevos</Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{marcaInfo?.nombre}</li>
            </ol>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {marcaInfo?.nombre}
            </h1>
            <p className="text-gray-600">
              Modelos seminuevos disponibles
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modelos.map((m) => (
              <Link
                key={m.id}
                href={`/seminuevos/${marcaSlug}/${createSlug(m.modelo)}`}
                className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                {m.imagenUrl ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                    <Image
                      src={m.imagenUrl}
                      alt={m.modelo}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Sin imagen</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {m.modelo}
                  </h3>
                  <p className="text-xl font-bold text-orange-500">
                    Desde Q{m.precioMinimo.toLocaleString("es-GT")}
                  </p>
                </div>
              </Link>
            ))}
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
