import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountdownTimer from "./CountdownTimer";
import EmailForm from "./EmailForm";

export const dynamic = 'force-dynamic';

export default async function ComingSoonPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Título principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ¡Próximamente!
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-12">
            Estamos trabajando en algo increíble para ti
          </p>

          {/* Cuenta regresiva */}
          <CountdownTimer />

          {/* Mensaje adicional */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <p className="text-lg text-gray-700 mb-4">
              Nuestro sitio estará disponible el{" "}
              <span className="font-bold text-orange-500">15 de marzo de 2026</span>
            </p>
            <p className="text-gray-600">
              Mientras tanto, síguenos en nuestras redes sociales para estar al día con las novedades
            </p>
          </div>

          {/* Opcional: Formulario de notificación por email */}
          <EmailForm />
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
