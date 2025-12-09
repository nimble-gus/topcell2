"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getCart,
  getCartTotal,
  clearCart,
  type CartItem,
} from "@/lib/cart";
import SingleImageUploader from "@/components/admin/SingleImageUploader";

interface CuentaBancaria {
  id: number;
  banco: string;
  numeroCuenta: string;
  tipoCuenta: string;
  nombreTitular: string;
}

const DIRECCION_BODEGA = "Cortijo 3 Ofibodega 924, 25-55 Zona 12, Ciudad de Guatemala";
const COSTO_ENVIO = 35;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
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

  // Formulario
  const [tipoEnvio, setTipoEnvio] = useState<"ENVIO" | "RECOGER_BODEGA">("ENVIO");
  const [metodoPago, setMetodoPago] = useState<"CONTRA_ENTREGA" | "TRANSFERENCIA" | "TARJETA">("CONTRA_ENTREGA");
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    nombreRecibe: "",
    telefonoRecibe: "",
    notas: "",
  });
  const [boletaPagoUrl, setBoletaPagoUrl] = useState<string>("");
  
  // Datos de tarjeta
  const [tarjetaData, setTarjetaData] = useState({
    numero: "",
    fechaVencimiento: "",
    cvv: "",
    nombreTitular: "",
  });

  useEffect(() => {
    loadCart();
    loadServerData();
    loadCuentasBancarias();
    loadUserProfile();
  }, [session]);

  const loadUserProfile = async () => {
    // Verificar si hay sesión de usuario (no admin)
    const storeSession = session?.user && (session.user as any)?.type === "user" ? session : null;
    
    if (storeSession) {
      try {
        const response = await fetch("/api/auth/perfil");
        if (response.ok) {
          const userData = await response.json();
          // Pre-llenar formulario con datos del usuario
          setFormData((prev) => ({
            ...prev,
            email: userData.email || prev.email,
            nombre: userData.nombre || prev.nombre,
            apellido: userData.apellido || prev.apellido,
            telefono: userData.telefono || prev.telefono,
            direccion: userData.direccion || prev.direccion,
            ciudad: userData.ciudad || prev.ciudad,
            codigoPostal: userData.codigoPostal || prev.codigoPostal,
            // Si el usuario tiene nombre completo, usar el nombre para "nombreRecibe" por defecto
            nombreRecibe: userData.nombre ? `${userData.nombre} ${userData.apellido || ""}`.trim() : prev.nombreRecibe,
            telefonoRecibe: userData.telefono || prev.telefonoRecibe,
          }));
        }
      } catch (error) {
        console.error("Error al cargar perfil del usuario:", error);
      }
    }
  };

  const loadCart = () => {
    const cartData = getCart();
    setCart(cartData);
    setLoading(false);
    
    if (cartData.length === 0 && !loading) {
      router.push("/carrito");
    }
  };

  const loadCuentasBancarias = async () => {
    try {
      const response = await fetch("/api/cuentas-bancarias");
      if (response.ok) {
        const data = await response.json();
        setCuentasBancarias(data);
      }
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Por favor ingresa un email válido");
      return false;
    }
    if (!formData.nombre || formData.nombre.trim().length < 2) {
      setError("Por favor ingresa tu nombre");
      return false;
    }
    if (!formData.telefono || formData.telefono.trim().length < 8) {
      setError("Por favor ingresa un número de teléfono válido");
      return false;
    }

    // Validaciones según tipo de envío
    if (tipoEnvio === "ENVIO") {
      if (!formData.direccion || formData.direccion.trim().length < 10) {
        setError("Por favor ingresa una dirección completa para el envío");
        return false;
      }
      if (!formData.ciudad || formData.ciudad.trim().length < 2) {
        setError("Por favor ingresa la ciudad");
        return false;
      }
      if (!formData.nombreRecibe || formData.nombreRecibe.trim().length < 2) {
        setError("Por favor ingresa el nombre de quien recibirá el pedido");
        return false;
      }
      if (!formData.telefonoRecibe || formData.telefonoRecibe.trim().length < 8) {
        setError("Por favor ingresa un teléfono de contacto para la entrega");
        return false;
      }
    }

    // Validaciones según método de pago
    if (metodoPago === "TRANSFERENCIA") {
      if (!boletaPagoUrl || boletaPagoUrl.trim().length === 0) {
        setError("Por favor sube la boleta de pago de la transferencia");
        return false;
      }
    }

    if (metodoPago === "TARJETA") {
      if (!tarjetaData.numero || tarjetaData.numero.replace(/\s/g, "").length < 13) {
        setError("Por favor ingresa un número de tarjeta válido");
        return false;
      }
      if (!tarjetaData.fechaVencimiento || !/^\d{4}$/.test(tarjetaData.fechaVencimiento)) {
        setError("Por favor ingresa una fecha de vencimiento válida (MMAA)");
        return false;
      }
      if (!tarjetaData.cvv || tarjetaData.cvv.length < 3) {
        setError("Por favor ingresa el CVV de la tarjeta");
        return false;
      }
      if (!tarjetaData.nombreTitular || tarjetaData.nombreTitular.trim().length < 3) {
        setError("Por favor ingresa el nombre del titular de la tarjeta");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    if (cart.length === 0) {
      setError("Tu carrito está vacío");
      return;
    }

    setSubmitting(true);

    try {
      const envio = tipoEnvio === "ENVIO" ? COSTO_ENVIO : 0;
      const direccionEnvio = tipoEnvio === "ENVIO" 
        ? formData.direccion.trim()
        : DIRECCION_BODEGA;
      const ciudadEnvio = tipoEnvio === "ENVIO" ? formData.ciudad.trim() : "Ciudad de Guatemala";

      const response = await fetch("/api/ordenes/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: {
            email: formData.email.trim(),
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim() || null,
            telefono: formData.telefono.trim(),
            direccion: formData.direccion.trim() || DIRECCION_BODEGA,
            ciudad: formData.ciudad.trim() || "Ciudad de Guatemala",
            codigoPostal: formData.codigoPostal.trim() || null,
          },
          tipoEnvio,
          metodoPago,
          direccionEnvio,
          ciudadEnvio,
          codigoPostalEnvio: formData.codigoPostal.trim() || null,
          nombreRecibe: tipoEnvio === "ENVIO" ? formData.nombreRecibe.trim() : null,
          telefonoRecibe: tipoEnvio === "ENVIO" ? formData.telefonoRecibe.trim() : null,
          boletaPagoUrl: metodoPago === "TRANSFERENCIA" ? boletaPagoUrl.trim() : null,
          notas: formData.notas.trim() || null,
          envio, // Costo de envío calculado
          items: cart.map((item) => ({
            tipo: item.tipo,
            productoId: item.productoId,
            varianteId: item.varianteId,
            colorId: item.colorId,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la orden");
      }

      // Si el método de pago es TARJETA, procesar el pago
      if (metodoPago === "TARJETA") {
        const envio = tipoEnvio === "ENVIO" ? COSTO_ENVIO : 0;
        const total = subtotal + envio;

        // Llamar al Paso 1 de pago con tarjeta
        const paso1Response = await fetch("/api/pagos/tarjeta/paso1", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ordenId: data.ordenId,
            tarjeta: {
              numero: tarjetaData.numero.replace(/\s/g, ""),
              fechaVencimiento: tarjetaData.fechaVencimiento,
              cvv: tarjetaData.cvv,
            },
            cliente: {
              nombre: formData.nombre.trim(),
              apellido: formData.apellido.trim() || "",
              email: formData.email.trim(),
              telefono: formData.telefono.trim(),
              direccion: tipoEnvio === "ENVIO" ? formData.direccion.trim() : DIRECCION_BODEGA,
              ciudad: tipoEnvio === "ENVIO" ? formData.ciudad.trim() : "Ciudad de Guatemala",
              codigoPostal: formData.codigoPostal.trim() || undefined,
              pais: "GT",
            },
            monto: total,
          }),
        });

        const paso1Data = await paso1Response.json();

        if (!paso1Response.ok) {
          // Construir mensaje de error más detallado
          let errorMessage = paso1Data.error || "Error al procesar el pago con tarjeta";
          if (paso1Data.codigoRespuesta) {
            errorMessage += ` (Código: ${paso1Data.codigoRespuesta})`;
          }
          if (paso1Data.detalles) {
            errorMessage += ` - ${paso1Data.detalles}`;
          }
          // En desarrollo, mostrar más detalles
          if (process.env.NODE_ENV === "development" && paso1Data.respuestaCompleta) {
            console.error("Respuesta completa de NeoPay:", paso1Data.respuestaCompleta);
          }
          throw new Error(errorMessage);
        }

        // Si fue aprobado directamente (sin 3DSecure)
        if (paso1Data.aprobado) {
          clearCart();
          router.push(`/orden/${data.ordenId}`);
          return;
        }

        // Si requiere 3DSecure, redirigir a la página de autenticación
        if (paso1Data.requiere3DSecure) {
          const params = new URLSearchParams({
            ordenId: data.ordenId.toString(),
            referenceId: paso1Data.referenceId || "",
            systemsTraceNo: paso1Data.systemsTraceNo || "",
          });
          
          // Si tenemos accessToken y deviceDataCollectionUrl, usarlos directamente
          if (paso1Data.accessToken && paso1Data.deviceDataCollectionUrl) {
            params.append("accessToken", paso1Data.accessToken);
            params.append("deviceDataCollectionUrl", paso1Data.deviceDataCollectionUrl);
          } else if (paso1Data.html) {
            // Si tenemos HTML completo, enviarlo
            params.append("html", paso1Data.html);
          }
          
          router.push(`/pago/3dsecure?${params.toString()}`);
          return;
        }

        // Si fue rechazado
        throw new Error(paso1Data.error || "El pago fue rechazado");
      }

      // Para otros métodos de pago, continuar normalmente
      clearCart();
      router.push(`/orden/${data.ordenId}`);
    } catch (error: any) {
      console.error("Error al crear orden:", error);
      setError(error.message || "Error al procesar la orden. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = getCartTotal();
  const envio = tipoEnvio === "ENVIO" ? COSTO_ENVIO : 0;
  const total = subtotal + envio;

  if (loading || !serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={serverData.logoUrl} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Tu carrito está vacío</p>
            <Link
              href="/catalogo"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Ir al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <Header logoUrl={serverData.logoUrl} />
      
      {/* Loader overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl border border-white/20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-gray-900">Procesando tu pedido...</p>
            <p className="text-sm text-gray-600 text-center">Por favor espera, esto puede tomar unos momentos</p>
          </div>
        </div>
      )}
      
      <main className="pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className={`space-y-4 sm:space-y-6 ${submitting ? 'pointer-events-none opacity-60' : ''}`}>
                {/* Información de contacto */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Información de Contacto
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          placeholder="Tu nombre"
                        />
                      </div>

                      <div>
                        <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          id="apellido"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleInputChange}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          placeholder="Tu apellido"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        placeholder="1234-5678"
                      />
                    </div>
                  </div>
                </div>

                {/* Opción de envío */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Opción de Entrega
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoEnvio"
                          value="ENVIO"
                          checked={tipoEnvio === "ENVIO"}
                          onChange={(e) => setTipoEnvio(e.target.value as "ENVIO")}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <span className="font-semibold text-gray-900">Envío a domicilio</span>
                          <span className="text-gray-600 ml-2">(Q{COSTO_ENVIO})</span>
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoEnvio"
                          value="RECOGER_BODEGA"
                          checked={tipoEnvio === "RECOGER_BODEGA"}
                          onChange={(e) => setTipoEnvio(e.target.value as "RECOGER_BODEGA")}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <span className="font-semibold text-gray-900">Recoger en bodega</span>
                          <span className="text-gray-600 ml-2">(Gratis)</span>
                        </div>
                      </label>
                    </div>

                    {tipoEnvio === "RECOGER_BODEGA" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 font-medium mb-2">
                          Dirección para recoger:
                        </p>
                        <p className="text-sm text-blue-800">
                          {DIRECCION_BODEGA}
                        </p>
                      </div>
                    )}

                    {tipoEnvio === "ENVIO" && (
                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div>
                          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                            Dirección de entrega <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="direccion"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleInputChange}
                            required={tipoEnvio === "ENVIO"}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                            placeholder="Calle, número, colonia, etc."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                              Ciudad <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="ciudad"
                              name="ciudad"
                              value={formData.ciudad}
                              onChange={handleInputChange}
                              required={tipoEnvio === "ENVIO"}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                              placeholder="Ciudad"
                            />
                          </div>

                          <div>
                            <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 mb-2">
                              Código Postal
                            </label>
                            <input
                              type="text"
                              id="codigoPostal"
                              name="codigoPostal"
                              value={formData.codigoPostal}
                              onChange={handleInputChange}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                              placeholder="00000"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="nombreRecibe" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de quien recibe <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="nombreRecibe"
                            name="nombreRecibe"
                            value={formData.nombreRecibe}
                            onChange={handleInputChange}
                            required={tipoEnvio === "ENVIO"}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                            placeholder="Nombre completo"
                          />
                        </div>

                        <div>
                          <label htmlFor="telefonoRecibe" className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono de contacto para entrega <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            id="telefonoRecibe"
                            name="telefonoRecibe"
                            value={formData.telefonoRecibe}
                            onChange={handleInputChange}
                            required={tipoEnvio === "ENVIO"}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                            placeholder="1234-5678"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Método de pago */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Método de Pago
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="metodoPago"
                          value="CONTRA_ENTREGA"
                          checked={metodoPago === "CONTRA_ENTREGA"}
                          onChange={(e) => setMetodoPago(e.target.value as "CONTRA_ENTREGA")}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="font-semibold text-gray-900">Pago Contra Entrega</span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="metodoPago"
                          value="TRANSFERENCIA"
                          checked={metodoPago === "TRANSFERENCIA"}
                          onChange={(e) => setMetodoPago(e.target.value as "TRANSFERENCIA")}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="font-semibold text-gray-900">Pago con Transferencia</span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="metodoPago"
                          value="TARJETA"
                          checked={metodoPago === "TARJETA"}
                          onChange={(e) => setMetodoPago(e.target.value as "TARJETA")}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="font-semibold text-gray-900">Pago con Tarjeta</span>
                      </label>
                    </div>

                    {metodoPago === "TRANSFERENCIA" && (
                      <div className="pt-4 border-t border-gray-200 space-y-4">
                        {cuentasBancarias.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">
                              Realiza tu transferencia a cualquiera de estas cuentas:
                            </p>
                            <div className="space-y-3">
                              {cuentasBancarias.map((cuenta) => (
                                <div
                                  key={cuenta.id}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                >
                                  <p className="font-semibold text-gray-900">{cuenta.banco}</p>
                                  <p className="text-sm text-gray-700">
                                    {cuenta.tipoCuenta} - {cuenta.numeroCuenta}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Titular: {cuenta.nombreTitular}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                              No hay cuentas bancarias configuradas. Por favor contacta con el administrador.
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sube la boleta de pago <span className="text-red-500">*</span>
                          </label>
                          <SingleImageUploader
                            imageUrl={boletaPagoUrl || null}
                            onImageChange={(url) => setBoletaPagoUrl(url || "")}
                            folder="boletas-pago"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Sube una imagen clara de la boleta de transferencia
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-blue-900 mb-2">
                            ⚠️ Importante:
                          </p>
                          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>El depósito será validado en un plazo de 1 a 3 días hábiles</li>
                            <li>Te informaremos por WhatsApp, llamada o correo cuando se haya acreditado el pago</li>
                            <li>Si escoges la opción de recoleccion en bodega, deberas esperar nuestra confirmación vía Whatsapp, llamada o correo donde te estaremos indicando que tu depósito fue recibido</li>

                          </ul>
                        </div>
                      </div>
                    )}

                    {metodoPago === "TARJETA" && (
                      <div className="pt-4 border-t border-gray-200 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-blue-900 mb-2">
                            🔒 Pago Seguro con 3DSecure
                          </p>
                          <p className="text-sm text-blue-800">
                            Tu información está protegida. Utilizamos tecnología 3DSecure para mayor seguridad.
                          </p>
                        </div>

                        <div>
                          <label htmlFor="numeroTarjeta" className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Tarjeta <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="numeroTarjeta"
                            name="numeroTarjeta"
                            value={tarjetaData.numero}
                            onChange={(e) => {
                              // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
                              const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                              const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                              setTarjetaData({ ...tarjetaData, numero: formatted });
                            }}
                            maxLength={19}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="fechaVencimiento" className="block text-sm font-medium text-gray-700 mb-2">
                              Fecha de Vencimiento <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="fechaVencimiento"
                              name="fechaVencimiento"
                              value={
                                tarjetaData.fechaVencimiento.length >= 2
                                  ? `${tarjetaData.fechaVencimiento.slice(0, 2)} / ${tarjetaData.fechaVencimiento.slice(2, 4)}`
                                  : tarjetaData.fechaVencimiento
                              }
                              onChange={(e) => {
                                // Remover todo excepto números
                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                setTarjetaData({ ...tarjetaData, fechaVencimiento: value });
                              }}
                              maxLength={7} // MM / YY = 7 caracteres (visual)
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                              placeholder="MM / YY"
                            />
                            <p className="text-xs text-gray-500 mt-1">Formato: MM / YY (ej: 12 / 29 para Diciembre 2029)</p>
                          </div>

                          <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                              CVV <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              value={tarjetaData.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                setTarjetaData({ ...tarjetaData, cvv: value });
                              }}
                              maxLength={4}
                              required
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                              placeholder="123"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="nombreTitular" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Titular <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="nombreTitular"
                            name="nombreTitular"
                            value={tarjetaData.nombreTitular}
                            onChange={(e) => setTarjetaData({ ...tarjetaData, nombreTitular: e.target.value.toUpperCase() })}
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                            placeholder="JUAN PEREZ"
                          />
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-yellow-900 mb-2">
                            ⚠️ Tarjetas de Prueba:
                          </p>
                          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                            <li>Visa: 4456530000001005 (Fecha: 2912, CVV: 123)</li>
                            <li>Mastercard: 4000000000002503 (Fecha: 2912, CVV: 123)</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas adicionales */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Notas Adicionales (Opcional)
                  </h2>
                  
                  <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones especiales para la entrega
                    </label>
                    <textarea
                      id="notas"
                      name="notas"
                      value={formData.notas}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Ej: Llamar antes de entregar, dejar en recepción, etc."
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-300 text-red-950 font-bold px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Link
                    href="/carrito"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    ← Volver al Carrito
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Procesando..." : `Confirmar Pedido - Q${total.toLocaleString("es-GT")}`}
                  </button>
                </div>
              </form>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Resumen del Pedido
                </h2>

                {/* Lista de productos */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.imagen || "/placeholder-phone.jpg"}
                          alt={`${item.marca} ${item.modelo}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.marca} {item.modelo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.color && `${item.color} • `}
                          {item.rom && `${item.rom} • `}
                          Cantidad: {item.cantidad}
                        </p>
                        <p className="text-sm font-semibold text-orange-500 mt-1">
                          Q{(item.precio * item.cantidad).toLocaleString("es-GT")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      Q{subtotal.toLocaleString("es-GT")}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío:</span>
                    <span className="font-semibold text-gray-900">
                      {envio === 0 ? "Gratis" : `Q${envio.toLocaleString("es-GT")}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total:</span>
                      <span className="text-orange-500">
                        Q{total.toLocaleString("es-GT")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
    </div>
  );
}
