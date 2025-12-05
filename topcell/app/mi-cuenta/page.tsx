"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
}

interface Orden {
  id: number;
  numeroOrden: string;
  estado: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    telefonoNuevo: any;
    telefonoSeminuevo: any;
    accesorio: any;
  }>;
}

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"perfil" | "ordenes">("perfil");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.type === "user") {
      loadServerData();
      fetchPerfil();
      fetchOrdenes();
    }
  }, [status, session, router]);

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

  const fetchPerfil = async () => {
    try {
      const response = await fetch("/api/auth/perfil");
      if (!response.ok) throw new Error("Error al cargar perfil");

      const data = await response.json();
      setUsuario(data);
      setFormData({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        ciudad: data.ciudad || "",
        codigoPostal: data.codigoPostal || "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdenes = async () => {
    try {
      const response = await fetch("/api/auth/mis-ordenes");
      if (!response.ok) throw new Error("Error al cargar órdenes");

      const data = await response.json();
      setOrdenes(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);

    try {
      const updateData: any = {
        nombre: formData.nombre,
        apellido: formData.apellido || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        ciudad: formData.ciudad || null,
        codigoPostal: formData.codigoPostal || null,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch("/api/auth/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar perfil");
      }

      setSuccess("Perfil actualizado exitosamente");
      fetchPerfil();
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error: any) {
      setError(error.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESANDO":
        return "bg-blue-100 text-blue-800";
      case "ENVIADO":
        return "bg-purple-100 text-purple-800";
      case "ENTREGADO":
        return "bg-green-100 text-green-800";
      case "CANCELADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Header logoUrl={serverData?.logoUrl || null} />
        <div className="min-h-screen bg-white pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando...</p>
            </div>
          </div>
        </div>
        <Footer
          logoUrl={serverData?.logoUrl || null}
          email={serverData?.footerEmail || null}
          telefono={serverData?.footerTelefono || null}
          facebookUrl={serverData?.footerFacebook || null}
          instagramUrl={serverData?.footerInstagram || null}
          tiktokUrl={serverData?.footerTiktok || null}
          servicios={serverData?.footerServicios || []}
          linkConocenos={serverData?.footerLinkConocenos || null}
          linkPrivacidad={serverData?.footerLinkPrivacidad || null}
          linkTerminos={serverData?.footerLinkTerminos || null}
        />
      </>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <>
      <Header logoUrl={serverData?.logoUrl || null} />
      <div className="min-h-screen bg-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Cuenta</h1>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("perfil")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "perfil"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Mi Perfil
              </button>
              <button
                onClick={() => setActiveTab("ordenes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "ordenes"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Mis Órdenes ({ordenes.length})
              </button>
            </nav>
          </div>

          {/* Contenido de Perfil */}
          {activeTab === "perfil" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Personal</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-md">
                  <p className="text-sm text-red-950 font-bold">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-md">
                  <p className="text-sm text-green-950 font-bold">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={usuario.email}
                    disabled
                    className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-500 px-4 py-3"
                  />
                  <p className="mt-1 text-xs text-gray-500">El email no se puede modificar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      id="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h3>
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
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
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
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Contenido de Órdenes */}
          {activeTab === "ordenes" && (
            <div className="space-y-4">
              {ordenes.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow p-12 text-center">
                  <p className="text-gray-500 mb-4">No tienes órdenes aún</p>
                  <Link
                    href="/catalogo"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Ver Catálogo
                  </Link>
                </div>
              ) : (
                ordenes.map((orden) => (
                  <div key={orden.id} className="bg-white rounded-lg border border-gray-200 shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Orden #{orden.numeroOrden}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(orden.createdAt).toLocaleDateString("es-GT", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getEstadoColor(
                            orden.estado
                          )}`}
                        >
                          {orden.estado}
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          Q{Number(orden.total).toLocaleString("es-GT")}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Productos:</h4>
                      <div className="space-y-2">
                        {orden.items.map((item) => {
                          const producto =
                            item.telefonoNuevo ||
                            item.telefonoSeminuevo ||
                            item.accesorio;
                          const imagen =
                            producto?.imagenes?.[0]?.url ||
                            "/placeholder-product.jpg";

                          return (
                            <div key={item.id} className="flex items-center gap-4">
                              <Image
                                src={imagen}
                                alt={producto?.modelo || "Producto"}
                                width={60}
                                height={60}
                                className="rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {producto?.marca?.nombre} {producto?.modelo}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Cantidad: {item.cantidad} × Q{Number(item.precioUnitario).toLocaleString("es-GT")}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                Q{Number(item.subtotal).toLocaleString("es-GT")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link
                        href={`/orden/${orden.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                      >
                        Ver detalles de la orden →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <Footer
        logoUrl={serverData?.logoUrl || null}
        email={serverData?.footerEmail || null}
        telefono={serverData?.footerTelefono || null}
        facebookUrl={serverData?.footerFacebook || null}
        instagramUrl={serverData?.footerInstagram || null}
        tiktokUrl={serverData?.footerTiktok || null}
        servicios={serverData?.footerServicios || []}
        linkConocenos={serverData?.footerLinkConocenos || null}
        linkPrivacidad={serverData?.footerLinkPrivacidad || null}
        linkTerminos={serverData?.footerLinkTerminos || null}
      />
    </>
  );
}

