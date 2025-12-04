import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";
import CTASection from "@/components/CTASection";
import BannerSection from "@/components/BannerSection";
import BrandsMarquee from "@/components/BrandsMarquee";
import Footer from "@/components/Footer";

export default async function Home() {
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

  // Obtener imágenes del hero
  const heroImages = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "hero",
      activo: true,
    },
    orderBy: [
      { orden: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Obtener teléfonos destacados
  const telefonosDestacados = await prisma.telefonoNuevo.findMany({
    where: {
      featured: true,
      activo: true,
    },
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
        take: 1, // Solo la primera imagen
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8, // Limitar a 8 productos destacados
  });

  // Obtener accesorios destacados
  const accesoriosDestacados = await prisma.accesorio.findMany({
    where: {
      featured: true,
      activo: true,
    },
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
        take: 1, // Solo la primera imagen
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8, // Limitar a 8 productos destacados
  });

  // Agrupar teléfonos por marca
  const telefonosPorMarca = telefonosDestacados.reduce((acc, telefono) => {
    const marcaId = telefono.marca.id;
    if (!acc[marcaId]) {
      acc[marcaId] = {
        marca: {
          id: telefono.marca.id,
          nombre: telefono.marca.nombre,
          logoUrl: telefono.marca.logoUrl,
        },
        telefonos: [],
      };
    }
    acc[marcaId].telefonos.push({
      id: telefono.id,
      modelo: telefono.modelo,
      precio: Number(telefono.precio),
      imagenUrl:
        telefono.imagenes.length > 0
          ? telefono.imagenes[0].url
          : "/placeholder-phone.jpg",
      marca: {
        id: telefono.marca.id,
        nombre: telefono.marca.nombre,
        logoUrl: telefono.marca.logoUrl,
      },
    });
    return acc;
  }, {} as Record<number, { marca: { id: number; nombre: string; logoUrl: string | null }; telefonos: any[] }>);

  // Convertir a array y filtrar solo marcas con logo
  const marcasConTelefonos = Object.values(telefonosPorMarca).filter(
    (grupo) => grupo.marca.logoUrl !== null
  );

  // Obtener imágenes publicitarias CTA
  const ctaImages = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "cta",
      activo: true,
    },
    orderBy: [
      { orden: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Obtener banners grandes
  const bannerImages = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "banner",
      activo: true,
    },
    orderBy: [
      { orden: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Obtener marcas con logos para el marquee
  const marcas = await prisma.marca.findMany({
    where: {
      logoUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      nombre: true,
      logoUrl: true,
    },
    orderBy: {
      nombre: "asc",
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

  // Extraer datos del footer
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

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-20">
        {/* Hero Section */}
        <HeroSection
          images={heroImages.map((img) => ({
            id: img.id,
            url: img.url,
            descripcion: img.descripcion,
            orden: img.orden,
          }))}
        />

        {/* Featured Section */}
        <FeaturedSection
          telefonosPorMarca={marcasConTelefonos}
          accesorios={accesoriosDestacados.map((accesorio) => ({
            id: accesorio.id,
            modelo: accesorio.modelo,
            descripcion: accesorio.descripcion,
            precio: Number(accesorio.precio),
            imagenUrl:
              accesorio.imagenes.length > 0
                ? accesorio.imagenes[0].url
                : "/placeholder-accessory.jpg",
            marca: {
              id: accesorio.marca.id,
              nombre: accesorio.marca.nombre,
              logoUrl: accesorio.marca.logoUrl,
            },
          }))}
        />

        {/* CTA Section */}
        <CTASection
          images={ctaImages.map((img) => ({
            id: img.id,
            url: img.url,
            urlDestino: img.urlDestino,
            descripcion: img.descripcion,
            orden: img.orden,
          }))}
        />

        {/* Banner Section */}
        <BannerSection
          banners={bannerImages.map((banner) => ({
            id: banner.id,
            url: banner.url,
            titulo: banner.titulo,
            urlDestino: banner.urlDestino,
            descripcion: banner.descripcion,
            orden: banner.orden,
          }))}
        />

        {/* Brands Marquee */}
        <BrandsMarquee
          brands={marcas.map((marca) => ({
            id: marca.id,
            nombre: marca.nombre,
            logoUrl: marca.logoUrl,
          }))}
        />


      </main>

      {/* Footer */}
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
