import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import DeleteBannerButton from "@/components/admin/DeleteBannerButton";

export default async function BannerPage() {
  const banners = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "banner",
    },
    orderBy: [
      { orden: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/contenido"
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            ← Volver a contenido
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Banners Publicitarios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los banners grandes con título, imagen y enlace de destino
          </p>
        </div>
        <Link
          href="/admin/contenido/banner/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Agregar Banner
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {banners.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-4 text-gray-500">No hay banners configurados</p>
            <Link
              href="/admin/contenido/banner/nuevo"
              className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Agregar Primer Banner
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {banners.map((banner) => (
              <div key={banner.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative h-40 w-64 overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={banner.url}
                        alt={banner.titulo || banner.descripcion || `Banner ${banner.orden}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {banner.titulo || `Banner ${banner.orden + 1}`}
                        </h3>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            banner.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {banner.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Orden: {banner.orden} | Creado:{" "}
                        {new Date(banner.createdAt).toLocaleDateString("es-GT")}
                      </p>
                      {banner.urlDestino && (
                        <p className="mt-2 text-sm text-blue-600 break-all">
                          🔗 Destino: {banner.urlDestino}
                        </p>
                      )}
                      {banner.descripcion && (
                        <p className="mt-2 text-sm text-gray-600">{banner.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/contenido/banner/${banner.id}`}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    <DeleteBannerButton id={banner.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

