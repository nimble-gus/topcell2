"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState<{
    logoUrl: string | null;
    footerEmail: string | null;
    footerTelefono: string | null;
    footerFacebook: string | null;
    footerInstagram: string | null;
    footerTiktok: string | null;
    footerServicios: string[];
    footerLinkConocenos: string | null;
    footerLinkPrivacidad: string | null;
    footerLinkTerminos: string | null;
  } | null>(null);

  useEffect(() => {
    loadServerData();
  }, []);

  const loadServerData = async () => {
    try {
      const response = await fetch("/api/contenido");
      if (response.ok) {
        const data = await response.json();
        const logoContent = data.find((item: any) => item.tipo === "logo" && item.activo);
        const footerData = data.filter((item: any) => 
          ["footer-email", "footer-telefono", "footer-facebook", "footer-instagram", 
           "footer-tiktok", "footer-servicio", "footer-link-conocenos", 
           "footer-link-privacidad", "footer-link-terminos"].includes(item.tipo) && item.activo
        );

        const footerEmail = footerData.find((item: any) => item.tipo === "footer-email")?.descripcion || null;
        const footerTelefono = footerData.find((item: any) => item.tipo === "footer-telefono")?.descripcion || null;
        const footerFacebook = footerData.find((item: any) => item.tipo === "footer-facebook")?.urlDestino || null;
        const footerInstagram = footerData.find((item: any) => item.tipo === "footer-instagram")?.urlDestino || null;
        const footerTiktok = footerData.find((item: any) => item.tipo === "footer-tiktok")?.urlDestino || null;
        const footerServicios = footerData
          .filter((item: any) => item.tipo === "footer-servicio")
          .map((item: any) => item.descripcion || "")
          .filter((s: string) => s.length > 0);
        const footerLinkConocenos = footerData.find((item: any) => item.tipo === "footer-link-conocenos")?.urlDestino || null;
        const footerLinkPrivacidad = footerData.find((item: any) => item.tipo === "footer-link-privacidad")?.urlDestino || null;
        const footerLinkTerminos = footerData.find((item: any) => item.tipo === "footer-link-terminos")?.urlDestino || null;

        setServerData({
          logoUrl: logoContent?.url || null,
          footerEmail,
          footerTelefono,
          footerFacebook,
          footerInstagram,
          footerTiktok,
          footerServicios,
          footerLinkConocenos,
          footerLinkPrivacidad,
          footerLinkTerminos,
        });
      }
    } catch (error) {
      console.error("Error al cargar datos del servidor:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          apellido: formData.apellido || null,
          telefono: formData.telefono || null,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      // Iniciar sesión automáticamente después del registro
      const result = await signIn("store-credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/mi-cuenta");
        router.refresh();
      } else {
        setError("Cuenta creada, pero no se pudo iniciar sesión. Por favor, inicia sesión manualmente.");
        setLoading(false);
      }
    } catch (error) {
      setError("Error al crear la cuenta. Intenta nuevamente.");
      setLoading(false);
    }
  };

  if (!serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header logoUrl={serverData.logoUrl} />
      <div className="min-h-screen bg-white pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Crear Cuenta
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Regístrate para ver tus órdenes y gestionar tu perfil
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-md">
                <p className="text-sm text-red-950 font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                    placeholder="Nombre"
                  />
                </div>

                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                    placeholder="Apellido"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                  placeholder="1234-5678"
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                  placeholder="Mínimo 6 caracteres"
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                  placeholder="Repite tu contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer
        logoUrl={serverData.logoUrl}
        email={serverData.footerEmail}
        telefono={serverData.footerTelefono}
        facebookUrl={serverData.footerFacebook}
        instagramUrl={serverData.footerInstagram}
        tiktokUrl={serverData.footerTiktok}
        servicios={serverData.footerServicios}
        linkConocenos={serverData.footerLinkConocenos}
        linkPrivacidad={serverData.footerLinkPrivacidad}
        linkTerminos={serverData.footerLinkTerminos}
      />
    </>
  );
}

