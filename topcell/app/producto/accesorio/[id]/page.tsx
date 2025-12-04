import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccesorioDetails from "@/components/product/AccesorioDetails";

export default async function AccesorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);

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
  const accesorio = await prisma.accesorio.findUnique({
    where: {
      id,
      activo: true,
    },
    include: {
      marca: true,
      colores: {
        include: {
          color: true,
        },
      },
      imagenes: {
        orderBy: { orden: "asc" },
      },
    },
  });

  if (!accesorio) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={logoContent?.url || null} />
        <main className="pt-20">
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
        <AccesorioDetails
          accesorio={{
            id: accesorio.id,
            modelo: accesorio.modelo,
            marca: accesorio.marca.nombre,
            marcaId: accesorio.marca.id,
            precio: Number(accesorio.precio),
            descripcion: accesorio.descripcion,
            imagenes: accesorio.imagenes.map(img => img.url),
            colores: accesorio.colores.map(c => ({
              id: c.id,
              colorId: c.colorId,
              color: c.color.color,
              stock: c.stock,
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

