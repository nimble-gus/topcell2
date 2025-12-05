import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MayoristasContent from "@/components/mayoristas/MayoristasContent";

export const metadata: Metadata = {
  title: "Programa Mayoristas",
  description: "Únete a nuestro programa de mayoristas y obtén precios especiales en grandes volúmenes. Ideal para negocios y distribuidores.",
};

export default async function MayoristasPage() {
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

  // Obtener link del video de YouTube
  const videoContent = await prisma.contenidoTienda.findFirst({
    where: {
      tipo: "mayoristas-video",
      activo: true,
    },
    orderBy: {
      orden: "asc",
    },
  });

  const videoUrl = videoContent?.urlDestino || null;

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-16 sm:pt-20">
        <MayoristasContent videoUrl={videoUrl} />
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

