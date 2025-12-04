import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteFooterItemButton from "@/components/admin/DeleteFooterItemButton";

export default async function FooterPage() {
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
    },
    orderBy: [
      { tipo: "asc" },
      { orden: "asc" },
    ],
  });

  // Agrupar por tipo
  const email = footerData.find((item) => item.tipo === "footer-email");
  const telefono = footerData.find((item) => item.tipo === "footer-telefono");
  const facebook = footerData.find((item) => item.tipo === "footer-facebook");
  const instagram = footerData.find((item) => item.tipo === "footer-instagram");
  const tiktok = footerData.find((item) => item.tipo === "footer-tiktok");
  const servicios = footerData.filter((item) => item.tipo === "footer-servicio");
  const linkConocenos = footerData.find((item) => item.tipo === "footer-link-conocenos");
  const linkPrivacidad = footerData.find((item) => item.tipo === "footer-link-privacidad");
  const linkTerminos = footerData.find((item) => item.tipo === "footer-link-terminos");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Footer</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona la información de contacto, redes sociales y enlaces del footer
          </p>
        </div>
        <Link
          href="/admin/contenido"
          className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
        >
          ← Volver
        </Link>
      </div>

      <div className="space-y-6">
        {/* Información de contacto */}
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Información de Contacto</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{email?.descripcion || "No configurado"}</p>
              </div>
              <Link
                href={email ? `/admin/contenido/footer/email/${email.id}` : "/admin/contenido/footer/email/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {email ? "Editar" : "Agregar"}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Teléfono</p>
                <p className="text-sm text-gray-600">{telefono?.descripcion || "No configurado"}</p>
              </div>
              <Link
                href={telefono ? `/admin/contenido/footer/telefono/${telefono.id}` : "/admin/contenido/footer/telefono/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {telefono ? "Editar" : "Agregar"}
              </Link>
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Redes Sociales</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Facebook</p>
                <p className="text-sm text-gray-600 break-all">{facebook?.urlDestino || "No configurado"}</p>
              </div>
              <Link
                href={facebook ? `/admin/contenido/footer/facebook/${facebook.id}` : "/admin/contenido/footer/facebook/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {facebook ? "Editar" : "Agregar"}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Instagram</p>
                <p className="text-sm text-gray-600 break-all">{instagram?.urlDestino || "No configurado"}</p>
              </div>
              <Link
                href={instagram ? `/admin/contenido/footer/instagram/${instagram.id}` : "/admin/contenido/footer/instagram/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {instagram ? "Editar" : "Agregar"}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">TikTok</p>
                <p className="text-sm text-gray-600 break-all">{tiktok?.urlDestino || "No configurado"}</p>
              </div>
              <Link
                href={tiktok ? `/admin/contenido/footer/tiktok/${tiktok.id}` : "/admin/contenido/footer/tiktok/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {tiktok ? "Editar" : "Agregar"}
              </Link>
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Servicios</h2>
            <Link
              href="/admin/contenido/footer/servicio/nuevo"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              + Agregar Servicio
            </Link>
          </div>
          <div className="p-6">
            {servicios.length > 0 ? (
              <div className="space-y-3">
                {servicios.map((servicio) => (
                  <div key={servicio.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <p className="text-sm text-gray-900">{servicio.descripcion}</p>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/contenido/footer/servicio/${servicio.id}`}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Editar
                      </Link>
                      <DeleteFooterItemButton
                        id={servicio.id}
                        tipo={servicio.tipo}
                        nombre={servicio.descripcion || "Servicio"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay servicios configurados</p>
            )}
          </div>
        </div>

        {/* Enlaces del footer */}
        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Enlaces del Footer</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Conócenos</p>
                <p className="text-sm text-gray-600 break-all">{linkConocenos?.urlDestino || "No configurado"}</p>
              </div>
              <Link
                href={linkConocenos ? `/admin/contenido/footer/link-conocenos/${linkConocenos.id}` : "/admin/contenido/footer/link-conocenos/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {linkConocenos ? "Editar" : "Agregar"}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Política de Privacidad</p>
                <p className="text-sm text-gray-600 break-all">{linkPrivacidad?.urlDestino || "No configurado"}</p>
              </div>
              <Link
                href={linkPrivacidad ? `/admin/contenido/footer/link-privacidad/${linkPrivacidad.id}` : "/admin/contenido/footer/link-privacidad/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {linkPrivacidad ? "Editar" : "Agregar"}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Términos y Condiciones</p>
                <p className="text-sm text-gray-600 break-all">{linkTerminos?.urlDestino || "No configurado"}</p>
              </div>
              <Link
                href={linkTerminos ? `/admin/contenido/footer/link-terminos/${linkTerminos.id}` : "/admin/contenido/footer/link-terminos/nuevo"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                {linkTerminos ? "Editar" : "Agregar"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

