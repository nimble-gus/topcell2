"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  telefonoId: number;
  modelo: string;
}

export default function DeleteButton({ telefonoId, modelo }: DeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Determinar la ruta según el contexto
      let path = `/api/admin/productos/nuevos/${telefonoId}`;
      if (window.location.pathname.includes('/seminuevos')) {
        path = `/api/admin/productos/seminuevos/${telefonoId}`;
      } else if (window.location.pathname.includes('/accesorios')) {
        path = `/api/admin/productos/accesorios/${telefonoId}`;
      }
      
      const response = await fetch(path, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el teléfono");
      }

      // Recargar la página para actualizar la lista
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Error al eliminar el teléfono");
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
      title={`Eliminar ${modelo}`}
    >
      Eliminar
    </button>
  );
}

