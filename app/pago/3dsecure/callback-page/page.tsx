"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ThreeDSecureCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasExecutedRef = useRef(false); // Prevenir ejecuciones duplicadas
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

  const ordenId = searchParams.get("ordenId");
  const referenceId = searchParams.get("referenceId");
  const systemsTraceNo = searchParams.get("systemsTraceNo");

  useEffect(() => {
    loadServerData();
    
    // Prevenir ejecuciones duplicadas (React Strict Mode monta 2 veces en dev)
    // sessionStorage persiste entre remounts; useRef no sobrevive unmount
    const paso = searchParams.get("paso") || "3";
    const storageKey = `3ds-confirmar-${ordenId}-${paso}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
      console.log("⚠️ Confirmación ya en curso o ejecutada, ignorando duplicado...");
      return;
    }
    if (hasExecutedRef.current) {
      console.log("⚠️ Callback ya se ejecutó (ref), ignorando...");
      return;
    }
    
    if (ordenId && referenceId) {
      hasExecutedRef.current = true;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(storageKey, "1");
      }
      console.log("✅ Ejecutando confirmarPago por primera vez...");
      confirmarPago();
    } else {
      setError("Faltan parámetros requeridos");
      setLoading(false);
    }
  }, [ordenId, referenceId, systemsTraceNo]);

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

  const confirmarPago = async () => {
    try {
      // ✅ Verificar si es Paso 5 (después del Paso 4)
      const paso = searchParams.get("paso");
      const endpoint = paso === "5" ? "/api/pagos/tarjeta/paso5" : "/api/pagos/tarjeta/paso3";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ordenId,
          referenceId,
          systemsTraceNo,
        }),
      });

      // Intentar parsear la respuesta JSON
      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("❌ Error al parsear respuesta JSON:", parseError);
        data = { error: "Error al procesar la respuesta del servidor" };
      }

      console.log("=== Respuesta del Paso 3 ===");
      console.log("Status:", response.status);
      console.log("Data:", data);

      // ✅ Si se requiere Paso 4, redirigir a la página de Paso 4
      if (response.ok && data.requierePaso4) {
        console.log("✅ Paso 4 requerido, redirigiendo...");
        const paso4Url = `/pago/3dsecure/paso4?ordenId=${ordenId}&referenceId=${data.referenceId}&systemsTraceNo=${systemsTraceNo || ""}&accessToken=${encodeURIComponent(data.accessToken)}&deviceDataCollectionUrl=${encodeURIComponent(data.deviceDataCollectionUrl)}`;
        router.push(paso4Url);
        return;
      }

      if (response.ok && data.aprobado) {
        setSuccess(true);
        // Redirigir a la página de confirmación de orden después de 2 segundos
        setTimeout(() => {
          router.push(`/orden/${ordenId}`);
        }, 2000);
      } else {
        // Mostrar error más detallado
        const errorMessage = data.error || data.mensaje || data.mensajeCatalogo || "Error al confirmar el pago";
        const codigoRespuesta = data.codigoRespuesta || "";
        const mensajeRespuesta = data.mensajeRespuesta || "";
        
        let errorCompleto = errorMessage;
        if (codigoRespuesta && codigoRespuesta !== "REQUIERE_PASO4") {
          errorCompleto += ` (Código: ${codigoRespuesta})`;
        }
        if (mensajeRespuesta && mensajeRespuesta !== errorMessage) {
          errorCompleto += ` - ${mensajeRespuesta}`;
        }
        
        // Log más detallado para debugging
        console.error("❌ Error en Paso 3:");
        console.error("  Status:", response.status, response.statusText);
        console.error("  Error:", errorMessage);
        console.error("  Código Respuesta:", codigoRespuesta || "N/A");
        console.error("  Mensaje Respuesta:", mensajeRespuesta || "N/A");
        console.error("  Data completa:", JSON.stringify(data, null, 2));
        
        setError(errorCompleto);
        // Limpiar flag para permitir reintento si el usuario recarga
        const paso = searchParams.get("paso") || "3";
        sessionStorage.removeItem(`3ds-confirmar-${ordenId}-${paso}`);
      }
    } catch (error: any) {
      console.error("❌ Error al confirmar pago:", error);
      setError(error.message || "Error al confirmar el pago. Por favor intenta nuevamente.");
      const paso = searchParams.get("paso") || "3";
      sessionStorage.removeItem(`3ds-confirmar-${ordenId}-${paso}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Confirmando pago...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={serverData.logoUrl} />
      
      <main className="pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {success ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Pago Confirmado!
              </h1>
              <p className="text-gray-600 mb-6">
                Tu pago ha sido procesado exitosamente. Redirigiendo a tu orden...
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Error en el Pago
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/checkout")}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Volver al Checkout
                </button>
                <button
                  onClick={() => router.push("/catalogo")}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Ir al Catálogo
                </button>
              </div>
            </div>
          )}
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

export default function ThreeDSecureCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ThreeDSecureCallbackContent />
    </Suspense>
  );
}

