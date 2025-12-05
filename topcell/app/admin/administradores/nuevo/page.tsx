"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NuevoAdministradorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    password: "",
    confirmPassword: "",
    rol: "admin",
    activo: true,
    permisos: {} as Record<string, boolean>,
  });

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
    if (!formData.email || !formData.nombre || !formData.password) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.rol === "admin" && Object.values(formData.permisos).every((v) => !v)) {
      setError("Debes seleccionar al menos un permiso para el administrador");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/admin/administradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          password: formData.password,
          rol: formData.rol,
          permisos: formData.rol === "superadmin" ? null : formData.permisos,
          activo: formData.activo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear administrador");
      }

      router.push("/admin/administradores");
    } catch (error: any) {
      setError(error.message || "Error al crear administrador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/administradores"
          className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block"
        >
          ← Volver a Administradores
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Administrador</h1>
        <p className="mt-2 text-sm text-gray-600">Crea un nuevo usuario del panel de administración</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
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
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Administrador"}
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

