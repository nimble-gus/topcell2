import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import DeleteModeloButton from "@/components/admin/DeleteModeloButton";

export default async function ModelosPage() {
  const modelos = await prisma.modelo.findMany({
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
        take: 1, // Solo la primera imagen para preview
      },
      _count: {
        select: {
          telefonosSeminuevos: true,
        },
      },
    },
    orderBy: [
      { marca: { nombre: "asc" } },
      { nombre: "asc" },
    ],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modelos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los modelos de teléfonos (ej: iPhone 14, Galaxy S24)
          </p>
        </div>
        <Link
          href="/admin/catalogo/modelos/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Nuevo Modelo
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Marca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Teléfonos Seminuevos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Creado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {modelos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay modelos registrados
                </td>
              </tr>
            ) : (
              modelos.map((modelo) => (
                <tr key={modelo.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {modelo.imagenes.length > 0 ? (
                      <div className="relative h-16 w-16">
                        <Image
                          src={modelo.imagenes[0].url}
                          alt={modelo.nombre}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {modelo.marca.nombre}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {modelo.nombre}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {modelo._count.telefonosSeminuevos}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(modelo.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/catalogo/modelos/${modelo.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <DeleteModeloButton modeloId={modelo.id} nombre={modelo.nombre} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
