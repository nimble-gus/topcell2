import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import DeleteHeroButton from "@/components/admin/DeleteHeroButton";

export default async function HeroImagesPage() {
  const heroImages = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "hero",
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
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Imágenes del Hero</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona las imágenes del carousel del hero
          </p>
        </div>
        <Link
          href="/admin/contenido/hero/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Agregar Imágenes
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {heroImages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-4 text-gray-500">No hay imágenes del hero configuradas</p>
            <Link
              href="/admin/contenido/hero/nuevo"
              className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Agregar Primera Imagen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {heroImages.map((image) => (
              <div key={image.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative h-32 w-56 overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.descripcion || `Hero image ${image.orden}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {image.descripcion || `Imagen ${image.orden + 1}`}
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
                      {image.descripcion && (
                        <p className="mt-2 text-sm text-gray-600">{image.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/contenido/hero/${image.id}`}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    <DeleteHeroButton id={image.id} />
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

