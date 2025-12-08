import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function TelefonosNuevosPage() {
  const telefonos = await prisma.telefonoNuevo.findMany({
    where: { activo: true },
      include: {
        marca: true,
        variantes: {
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
          <h1 className="text-3xl font-bold text-gray-900">Teléfonos Nuevos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona el catálogo de teléfonos nuevos
          </p>
        </div>
        <Link
          href="/admin/productos/nuevos/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          + Nuevo Teléfono
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
                Marca / Modelo
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
            {telefonos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay teléfonos nuevos registrados
                </td>
              </tr>
            ) : (
              telefonos.map((telefono) => (
                <tr key={telefono.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {telefono.imagenes.length > 0 ? (
                      <img
                        src={telefono.imagenes[0].url}
                        alt={telefono.modelo}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {telefono.marca.nombre}
                    </div>
                    <div className="text-sm text-gray-500">{telefono.modelo}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    Q{telefono.precio.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          telefono.stock < 10
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        Total: {telefono.stock}
                      </span>
                      {telefono.variantes.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {telefono.variantes.map((v) => (
                            <div key={v.id}>
                              {v.color.color} {v.rom}: {v.stock}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {telefono.variantes.length > 0
                      ? telefono.variantes
                          .map((v) => `${v.color.color} ${v.rom}`)
                          .join(", ")
                      : "Sin variantes"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/productos/nuevos/${telefono.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <DeleteButton telefonoId={telefono.id} modelo={telefono.modelo} />
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

