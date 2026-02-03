"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ThreeDSecureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const htmlDivRef = useRef<HTMLDivElement>(null);
  
  const [html, setHtml] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [deviceDataCollectionUrl, setDeviceDataCollectionUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    
    // Obtener datos del query param
    const htmlParam = searchParams.get("html");
    const accessTokenParam = searchParams.get("accessToken");
    const deviceUrlParam = searchParams.get("deviceDataCollectionUrl");
    
    if (htmlParam) {
      setHtml(decodeURIComponent(htmlParam));
      setLoading(false);
    } else if (accessTokenParam && deviceUrlParam) {
      // Si tenemos accessToken y URL, construir el formulario
      setAccessToken(accessTokenParam);
      setDeviceDataCollectionUrl(decodeURIComponent(deviceUrlParam));
      setLoading(false);
    } else {
      setError("No se recibió el formulario de autenticación");
      setLoading(false);
    }
  }, [searchParams]);

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

  // Escuchar mensajes del iframe (Cardinal Commerce)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("=== Mensaje recibido ===");
      console.log("Origin:", event.origin);
      console.log("Data type:", typeof event.data);
      console.log("Data:", event.data);
      
      // Solo aceptar mensajes de Cardinal Commerce (startsWith por si usan subdominios o variantes)
      const allowedOrigins = [
        "https://centinelapistag.cardinalcommerce.com",
        "https://centinelapi.cardinalcommerce.com",
        "https://songbird.cardinalcommerce.com",
        "https://cas.client.cardinaltrusted.com",
      ];
      
      const isAllowedOrigin = allowedOrigins.some(origin => event.origin.startsWith(origin));
      if (!isAllowedOrigin) {
        console.log("⚠️ Origen no permitido, ignorando mensaje:", event.origin);
        return;
      }

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        console.log("=== ✅ Mensaje procesado de Cardinal Commerce ===");
        console.log("MessageType:", data.MessageType);
        console.log("Status:", data.Status);
        console.log("Data completa:", JSON.stringify(data, null, 2));

        // Verificar si el Device Data Collection (DDC) se completó exitosamente
        // Cardinal puede enviar MessageType/profile.completed con distintas variantes y Status true/"true"/SUCCESS
        const status = data.Status !== undefined ? data.Status : data.status;
        const messageType = data.MessageType || data.messageType;
        const isCompleted =
          (messageType === "profile.completed" || messageType === "ProfileCompleted" || messageType === "Profile.Completed") &&
          (status === true || status === "true" || status === "SUCCESS" || status === "Success");
        
        if (isCompleted) {
          console.log("✅ Songbird (Cardinal Commerce) completó el DDC exitosamente");
          console.log("Status:", status);
          console.log("MessageType:", data.MessageType);
          console.log("SessionId:", data.SessionId);
          
          // Prevenir múltiples redirecciones usando una bandera
          if ((window as any).__3DSecureRedirecting) {
            console.log("⚠️ Redirección ya en progreso, ignorando...");
            return;
          }
          (window as any).__3DSecureRedirecting = true;
          
          // Esperar un momento para asegurar que Cardinal Commerce notifique a NeoPay
          // antes de proceder con el Paso 3. El delay permite que la comunicación
          // entre Cardinal Commerce y NeoPay se complete.
          // Aumentamos el delay a 15 segundos para dar más tiempo a Cardinal Commerce
          console.log("⏳ Esperando 15 segundos para que Cardinal Commerce notifique a NeoPay...");
          
          setTimeout(() => {
            console.log("✅ Redirigiendo al callback para proceder con Paso 3...");
            if (ordenId && referenceId) {
              // Limpiar la bandera antes de redirigir para permitir la siguiente ejecución
              (window as any).__3DSecureRedirecting = false;
              router.push(
                `/pago/3dsecure/callback-page?ordenId=${ordenId}&referenceId=${referenceId}&systemsTraceNo=${systemsTraceNo || ""}`
              );
            }
          }, 15000); // Esperar 15 segundos antes de redirigir
        } 
        // Verificar si hay error o fallo
        else if (data.Status === "FAILURE" || data.Status === "ERROR" || (data.MessageType && data.MessageType.includes("error"))) {
          console.error("❌ Autenticación fallida:", data);
          setError("La autenticación 3DSecure falló. Por favor intenta nuevamente.");
        } 
        // Otros mensajes intermedios
        else {
          console.log("ℹ️ Estado intermedio - MessageType:", data.MessageType, "Status:", data.Status);
          // Si es un mensaje de progreso, solo loguear pero no hacer nada aún
        }
      } catch (error) {
        console.error("❌ Error al procesar mensaje:", error);
        // Intentar procesar como string si no es JSON
        if (typeof event.data === "string") {
          console.log("Mensaje como string:", event.data);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("✅ Listener de mensajes configurado para Cardinal Commerce");
    console.log("Esperando mensajes de:", [
      "https://centinelapistag.cardinalcommerce.com",
      "https://centinelapi.cardinalcommerce.com",
      "https://songbird.cardinalcommerce.com",
    ]);
    
    return () => {
      window.removeEventListener("message", handleMessage);
      console.log("Listener de mensajes removido");
    };
  }, [ordenId, referenceId, systemsTraceNo, router]);

  // Función para enviar el formulario
  const submitFormRef = useRef(false); // Prevenir múltiples envíos
  const iframeLoadCountRef = useRef(0); // Contar cuántas veces se carga el iframe
  
  const submitForm = () => {
    // Prevenir múltiples envíos
    if (submitFormRef.current) {
      console.log("⚠️ Formulario ya fue enviado, ignorando...");
      return true;
    }
    
    const form = formRef.current;
    const iframe = iframeRef.current;
    
    if (!form) {
      console.warn("⚠️ Formulario no encontrado en el DOM");
      return false;
    }
    
    if (!iframe) {
      console.warn("⚠️ Iframe no encontrado en el DOM");
      return false;
    }

    console.log("=== Enviando formulario 3DSecure al iframe ===");
    console.log("AccessToken (primeros 50 chars):", accessToken.substring(0, 50) + "...");
    console.log("DeviceDataCollectionUrl:", deviceDataCollectionUrl);
    console.log("Form action:", form.action);
    console.log("Form target:", form.target);
    
    try {
      submitFormRef.current = true; // Marcar como enviado antes de hacer submit
      form.submit();
      console.log("✅ Formulario enviado exitosamente al iframe");
      return true;
    } catch (error) {
      console.error("❌ Error al enviar formulario:", error);
      submitFormRef.current = false; // Permitir reintento si hay error
      return false;
    }
  };

  // Callback ref para el iframe - solo guarda la referencia
  const iframeCallbackRef = (iframeElement: HTMLIFrameElement | null) => {
    iframeRef.current = iframeElement;
  };

  // Resetear banderas cuando cambian los parámetros
  useEffect(() => {
    if (accessToken && deviceDataCollectionUrl) {
      submitFormRef.current = false;
      iframeLoadCountRef.current = 0;
    }
  }, [accessToken, deviceDataCollectionUrl]);

  // Auto-submit cuando los elementos estén montados
  useEffect(() => {
    if (!accessToken || !deviceDataCollectionUrl) {
      return;
    }

    // Resetear la bandera cuando cambian los parámetros
    submitFormRef.current = false;
    iframeLoadCountRef.current = 0;

    // Función para verificar y enviar
    const trySubmit = () => {
      const form = formRef.current;
      const iframe = iframeRef.current;
      
      console.log("🔍 Verificando elementos (Paso 2 - DDC):", {
        form: !!form,
        iframe: !!iframe,
        formInDOM: form ? document.contains(form) : false,
        iframeInDOM: iframe ? document.contains(iframe) : false,
        formSubmitted: submitFormRef.current,
      });
      
      if (form && iframe && document.contains(form) && document.contains(iframe) && !submitFormRef.current) {
        console.log("✅ Formulario e iframe encontrados en el DOM (Paso 2), enviando...");
        submitForm();
        return true;
      }
      return false;
    };

    // Usar un delay más largo para asegurar que React haya renderizado completamente
    const timeoutId = setTimeout(() => {
      if (trySubmit()) {
        return;
      }

      // Si no están listos, intentar después de otro delay
      const timeoutId2 = setTimeout(() => {
        if (trySubmit()) {
          return;
        }
        
        // Último intento
        const timeoutId3 = setTimeout(() => {
          if (!trySubmit()) {
            console.error("❌ No se pudieron encontrar el formulario o el iframe después de múltiples intentos (Paso 2)");
            setError("No se pudo cargar el formulario de autenticación 3DSecure. Por favor, intenta nuevamente.");
          }
        }, 1000);
        
        return () => clearTimeout(timeoutId3);
      }, 500);
      
      return () => clearTimeout(timeoutId2);
    }, 500); // Delay inicial de 500ms

    return () => {
      clearTimeout(timeoutId);
    };
  }, [accessToken, deviceDataCollectionUrl]);

  if (loading || !serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={serverData.logoUrl} />
        <div className="pt-16 sm:pt-20 pb-8 sm:pb-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push("/checkout")}
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Volver al Checkout
              </button>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={serverData.logoUrl} />
      
      <main className="pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Autenticación de Tarjeta
            </h1>
            <p className="text-gray-600 mb-6">
              Por favor, completa la autenticación de tu tarjeta en el siguiente formulario.
            </p>
            
            {/* Contenedor para el formulario 3DSecure */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {accessToken && deviceDataCollectionUrl ? (
                <>
                  {/* Iframe oculto según el manual (PaymentForm.html) para Device Data Collection */}
                  <iframe
                    ref={iframeCallbackRef}
                    name="ddc-iframe"
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    title="3D Secure Device Data Collection"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    onLoad={() => {
                      iframeLoadCountRef.current += 1;
                      console.log(`✅ Iframe DDC cargado (carga #${iframeLoadCountRef.current})`);
                      // El formulario se envía automáticamente desde el useEffect cuando los elementos están listos
                      // Este onLoad se dispara cuando Cardinal Commerce recarga el iframe después del submit
                    }}
                    onError={(e) => {
                      console.error("❌ Error al cargar iframe:", e);
                      setError("Error al cargar el formulario de autenticación. Por favor, intenta nuevamente.");
                    }}
                  />
                  
                  {/* Formulario oculto que se auto-submitea al iframe */}
                  <form
                    ref={formRef}
                    id="ddc-form"
                    target="ddc-iframe"
                    method="POST"
                    action={deviceDataCollectionUrl}
                    style={{ display: "none" }}
                  >
                    <input type="hidden" name="JWT" value={accessToken} />
                  </form>
                  
                  {/* Mensaje mientras se procesa */}
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p className="text-gray-600">Procesando autenticación 3DSecure...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Cardinal Commerce está verificando tu tarjeta. Por favor espera...
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                      Si aparece un popup, por favor completa la autenticación allí.
                    </p>
                  </div>
                </>
              ) : html ? (
                <div
                  ref={htmlDivRef}
                  dangerouslySetInnerHTML={{ __html: html }}
                  className="w-full"
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>Cargando formulario de autenticación...</p>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
              <p>No cierres esta ventana hasta completar la autenticación.</p>
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

export default function ThreeDSecurePage() {
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
      <ThreeDSecureContent />
    </Suspense>
  );
}

