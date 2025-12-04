"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteMarcaButtonProps {
  marcaId: number;
  nombre: string;
}

export default function DeleteMarcaButton({ marcaId, nombre }: DeleteMarcaButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/marcas/${marcaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar la marca");
      }

      // Recargar la página para actualizar la lista
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Error al eliminar la marca");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-600 hover:text-red-900 font-semibold disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Sí"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={deleting}
          className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-900"
      title={`Eliminar ${nombre}`}
    >
      Eliminar
    </button>
  );
}

