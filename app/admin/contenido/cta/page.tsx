import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import DeleteCTAButton from "@/components/admin/DeleteCTAButton";

export default async function CTAPage() {
  const ctaImages = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "cta",
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
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Imágenes Publicitarias CTA</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona las imágenes publicitarias con enlaces de destino
          </p>
        </div>
        <Link
          href="/admin/contenido/cta/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Agregar Imagen CTA
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {ctaImages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-4 text-gray-500">No hay imágenes CTA configuradas</p>
            <Link
              href="/admin/contenido/cta/nuevo"
              className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Agregar Primera Imagen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {ctaImages.map((image) => (
              <div key={image.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative h-32 w-56 overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.descripcion || `CTA ${image.orden}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {image.descripcion || `Imagen CTA ${image.orden + 1}`}
                        </h3>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            image.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {image.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Orden: {image.orden} | Creado:{" "}
                        {new Date(image.createdAt).toLocaleDateString("es-GT")}
                      </p>
                      {image.urlDestino && (
                        <p className="mt-2 text-sm text-blue-600 break-all">
                          🔗 Destino: {image.urlDestino}
                        </p>
                      )}
                      {image.descripcion && (
                        <p className="mt-2 text-sm text-gray-600">{image.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/contenido/cta/${image.id}`}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    <DeleteCTAButton id={image.id} />
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

