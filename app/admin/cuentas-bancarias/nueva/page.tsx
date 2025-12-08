"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevaCuentaBancariaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    banco: "",
    numeroCuenta: "",
    tipoCuenta: "Ahorro",
    nombreTitular: "",
    activo: true,
    orden: 0,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/cuentas-bancarias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la cuenta bancaria");
      }

      router.push("/admin/cuentas-bancarias");
    } catch (error: any) {
      console.error("Error al crear cuenta bancaria:", error);
      setError(error.message || "Error al crear la cuenta bancaria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/cuentas-bancarias"
          className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
        >
          ← Volver a Cuentas Bancarias
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cuenta Bancaria</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 shadow p-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="banco" className="block text-sm font-medium text-gray-700 mb-2">
              Banco <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="banco"
              name="banco"
              value={formData.banco}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Ej: Banco Industrial, G&T Continental, etc."
            />
          </div>

          <div>
            <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Cuenta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="numeroCuenta"
              name="numeroCuenta"
              value={formData.numeroCuenta}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label htmlFor="tipoCuenta" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cuenta <span className="text-red-500">*</span>
            </label>
            <select
              id="tipoCuenta"
              name="tipoCuenta"
              value={formData.tipoCuenta}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="Ahorro">Ahorro</option>
              <option value="Corriente">Corriente</option>
              <option value="Monetaria">Monetaria</option>
            </select>
          </div>

          <div>
            <label htmlFor="nombreTitular" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Titular <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombreTitular"
              name="nombreTitular"
              value={formData.nombreTitular}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Nombre completo del titular"
            />
          </div>

          <div>
            <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-2">
              Orden de Visualización
            </label>
            <input
              type="number"
              id="orden"
              name="orden"
              value={formData.orden}
              onChange={handleInputChange}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Las cuentas se mostrarán ordenadas por este número (menor a mayor)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
              Activa (se mostrará en el checkout)
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <Link
              href="/admin/cuentas-bancarias"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
