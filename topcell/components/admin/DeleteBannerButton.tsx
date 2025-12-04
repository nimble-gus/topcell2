"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteBannerButtonProps {
  id: number;
}

export default function DeleteBannerButton({ id }: DeleteBannerButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/contenido/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el banner");
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || "Error al eliminar el banner");
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          disabled={deleting}
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Confirmar"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}

