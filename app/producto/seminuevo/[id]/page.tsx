import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetails from "@/components/product/ProductDetails";

export const dynamic = 'force-dynamic';

export default async function TelefonoSeminuevoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variante?: string }>;
}) {
  const { id: idParam } = await params;
  const { variante: varianteIdParam } = await searchParams;
  const id = parseInt(idParam);
  const varianteIdInicial = varianteIdParam ? parseInt(varianteIdParam) : null;

  if (isNaN(id)) {
    return (
      <div className="min-h-screen bg-white">
        <p className="text-center py-12 text-gray-600">Producto no encontrado</p>
      </div>
    );
  }

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

  // Obtener el producto
  const telefono = await prisma.telefonoSeminuevo.findUnique({
    where: {
      id,
      activo: true,
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

  if (!telefono) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={logoContent?.url || null} />
        <main className="pt-16 sm:pt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-center text-gray-600">Producto no encontrado</p>
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

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-20">
        <ProductDetails
          tipo="telefono-seminuevo"
          varianteIdInicial={varianteIdInicial}
          producto={{
            id: telefono.id,
            modelo: telefono.modelo?.nombre || "Sin modelo",
            marca: telefono.marca.nombre,
            marcaId: telefono.marca.id,
            precio: Number(telefono.precio),
            procesador: telefono.procesador,
            ram: telefono.ram,
            mpxlsCamara: telefono.mpxlsCamara,
            tamanoPantalla: telefono.tamanoPantalla,
            tipoEntrada: telefono.tipoEntrada,
            descripcion: telefono.descripcion,
            imagenes: telefono.modelo?.imagenes.map(img => img.url) || [], // Imágenes de catálogo del modelo
            variantes: telefono.variantes.map(v => ({
              id: v.id,
              colorId: v.colorId,
              color: v.color.color,
              rom: v.rom,
              precio: Number(v.precio),
              stock: v.stock,
              estado: v.estado,
              porcentajeBateria: v.porcentajeBateria,
              ciclosCarga: v.ciclosCarga,
              imagenes: v.imagenes.map(img => img.url), // Imágenes específicas de la variante
            })),
          }}
        />
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

