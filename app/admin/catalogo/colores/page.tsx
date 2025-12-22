import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteColorButton from "@/components/admin/DeleteColorButton";

export default async function ColoresPage() {
  const colores = await prisma.color.findMany({
    orderBy: {
      color: "asc",
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Colores</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los colores disponibles para productos
          </p>
        </div>
        <Link
          href="/admin/catalogo/colores/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + Nuevo Color
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {colores.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No hay colores registrados
          </div>
        ) : (
          colores.map((color) => (
            <div
              key={color.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {color.color}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/catalogo/colores/${color.id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    Editar
                  </Link>
                  <DeleteColorButton colorId={color.id} nombre={color.color} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

