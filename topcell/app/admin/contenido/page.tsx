import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ContenidoPage() {
  const contenido = await prisma.contenidoTienda.findMany({
    orderBy: [
      { tipo: "asc" },
      { orden: "asc" },
    ],
  });

  // Agrupar por tipo
  const contenidoPorTipo = contenido.reduce((acc, item) => {
    if (!acc[item.tipo]) {
      acc[item.tipo] = [];
    }
    acc[item.tipo].push(item);
    return acc;
  }, {} as Record<string, typeof contenido>);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contenido de la Tienda</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona el logo, imágenes del hero y banners
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/contenido/logo"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Gestionar Logo
          </Link>
          <Link
            href="/admin/contenido/hero"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Gestionar Hero
          </Link>
        </div>
      </div>

      {/* Logo Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Logo</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          {contenidoPorTipo["logo"] && contenidoPorTipo["logo"].length > 0 ? (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={contenidoPorTipo["logo"][0].url}
                    alt="Logo"
                    className="h-20 w-auto object-contain"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contenidoPorTipo["logo"][0].descripcion || "Logo principal"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contenidoPorTipo["logo"][0].activo ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/contenido/logo"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Editar
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p className="mb-4">No hay logo configurado</p>
              <Link
                href="/admin/contenido/logo"
                className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Agregar Logo
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Imágenes del Hero</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          {contenidoPorTipo["hero"] && contenidoPorTipo["hero"].length > 0 ? (
            <div className="divide-y divide-gray-200">
              {contenidoPorTipo["hero"].map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.url}
                        alt={item.descripcion || "Hero image"}
                        className="h-24 w-40 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.descripcion || `Imagen ${item.orden + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Orden: {item.orden} | {item.activo ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/contenido/hero/${item.id}`}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p className="mb-4">No hay imágenes del hero configuradas</p>
              <Link
                href="/admin/contenido/hero/nuevo"
                className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Agregar Imagen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

