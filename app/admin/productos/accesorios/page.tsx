import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AccesoriosPage() {
  const accesorios = await prisma.accesorio.findMany({
    where: { activo: true },
    include: {
      marca: true,
      colores: {
        include: {
          color: true,
        },
      },
      imagenes: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accesorios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona el catálogo de accesorios
          </p>
        </div>
        <Link
          href="/admin/productos/accesorios/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          + Nuevo Accesorio
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
                Marca / Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Colores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {accesorios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay accesorios registrados
                </td>
              </tr>
            ) : (
              accesorios.map((accesorio) => (
                <tr key={accesorio.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {accesorio.imagenes.length > 0 ? (
                      <img
                        src={accesorio.imagenes[0].url}
                        alt={accesorio.descripcion}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {accesorio.marca.nombre}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {accesorio.descripcion}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    Q{accesorio.precio.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          accesorio.stock < 10
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        Total: {accesorio.stock}
                      </span>
                      {accesorio.colores.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {accesorio.colores.map((c) => (
                            <div key={c.id}>
                              {c.color.color}: {c.stock}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {accesorio.colores.length > 0
                      ? accesorio.colores
                          .map((c) => c.color.color)
                          .join(", ")
                      : "Sin colores"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/productos/accesorios/${accesorio.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <DeleteButton telefonoId={accesorio.id} modelo={accesorio.descripcion} />
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

