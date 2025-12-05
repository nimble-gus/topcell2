"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// Definir las secciones disponibles con sus permisos
const SECCIONES_PERMISOS = [
  { key: "productos", label: "Productos (Nuevos, Seminuevos, Accesorios)" },
  { key: "catalogo", label: "Catálogo (Marcas, Colores)" },
  { key: "contenido", label: "Contenido (Hero, CTA, Banner, Footer)" },
  { key: "ubicaciones", label: "Ubicaciones" },
  { key: "mayoristas", label: "Mayoristas" },
  { key: "cuentasBancarias", label: "Cuentas Bancarias" },
  { key: "ordenes", label: "Órdenes" },
  { key: "usuarios", label: "Usuarios (Clientes)" },
  { key: "inventario", label: "Inventario" },
];

interface Administrador {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  permisos: any;
  activo: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export default function EditarAdministradorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [administrador, setAdministrador] = useState<Administrador | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    password: "",
    confirmPassword: "",
    rol: "admin",
    activo: true,
    permisos: {} as Record<string, boolean>,
  });

  useEffect(() => {
    if (id) {
      fetchAdministrador();
    }
  }, [id]);

  const fetchAdministrador = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/administradores/${id}`);
      if (!response.ok) {
        if (response.status === 403) {
          alert("No tienes permisos para ver esta sección");
          router.push("/admin/administradores");
          return;
        }
        throw new Error("Error al cargar administrador");
      }

      const data = await response.json();
      setAdministrador(data);
      setFormData({
        nombre: data.nombre,
        password: "",
        confirmPassword: "",
        rol: data.rol,
        activo: data.activo,
        permisos: data.permisos && typeof data.permisos === "object" ? data.permisos : {},
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.nombre) {
      setError("El nombre es requerido");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.rol === "admin" && Object.values(formData.permisos).every((v) => !v)) {
      setError("Debes seleccionar al menos un permiso para el administrador");
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        nombre: formData.nombre,
        rol: formData.rol,
        permisos: formData.rol === "superadmin" ? null : formData.permisos,
        activo: formData.activo,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/administradores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar administrador");
      }

      router.push("/admin/administradores");
    } catch (error: any) {
      setError(error.message || "Error al actualizar administrador");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando administrador...</p>
        </div>
      </div>
    );
  }

  if (!administrador) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Administrador no encontrado</p>
          <Link href="/admin/administradores" className="text-indigo-600 hover:underline mt-4 inline-block">
            Volver a Administradores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/administradores"
          className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block"
        >
          ← Volver a Administradores
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Administrador</h1>
        <p className="mt-2 text-sm text-gray-600">Modifica la información del administrador</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-md">
            <p className="text-sm text-red-950 font-bold">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Información básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={administrador.email}
                disabled
                className="w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">El email no se puede modificar</p>
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
            <p className="text-sm text-gray-600 mb-4">
              Deja en blanco si no deseas cambiar la contraseña
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  minLength={6}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Rol */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rol</h2>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rol"
                  value="superadmin"
                  checked={formData.rol === "superadmin"}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Super Admin</strong> - Acceso completo a todas las secciones
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rol"
                  value="admin"
                  checked={formData.rol === "admin"}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Admin</strong> - Acceso limitado según permisos seleccionados
                </span>
              </label>
            </div>
          </div>

          {/* Permisos (solo para admin) */}
          {formData.rol === "admin" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Permisos</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona las secciones a las que este administrador tendrá acceso:
              </p>
              <div className="space-y-2">
                {SECCIONES_PERMISOS.map((seccion) => (
                  <label key={seccion.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permisos[seccion.key] || false}
                      onChange={(e) => handlePermisoChange(seccion.key, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{seccion.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Estado */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Usuario activo</span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
            <Link
              href="/admin/administradores"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

