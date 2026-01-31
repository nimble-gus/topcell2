"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ThreeDSecurePaso4Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const redirectingRef = useRef(false);
  const formSubmittedRef = useRef(false); // Bandera para prevenir múltiples submits
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [accessToken, setAccessToken] = useState<string>("");
  const [deviceDataCollectionUrl, setDeviceDataCollectionUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverData, setServerData] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null); // Segundos restantes antes de redirigir

  const ordenId = searchParams.get("ordenId");
  const referenceId = searchParams.get("referenceId");
  const systemsTraceNo = searchParams.get("systemsTraceNo");

  // Cargar datos del servidor para Header y Footer
  useEffect(() => {
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
    loadServerData();
  }, []);

  // Obtener datos del query param (solo una vez)
  useEffect(() => {
    const accessTokenParam = searchParams.get("accessToken");
    const deviceUrlParam = searchParams.get("deviceDataCollectionUrl");
    
    if (accessTokenParam && deviceUrlParam) {
      // Solo actualizar si no están ya establecidos (prevenir recargas)
      if (!accessToken || !deviceDataCollectionUrl) {
        setAccessToken(accessTokenParam);
        setDeviceDataCollectionUrl(decodeURIComponent(deviceUrlParam));
        setLoading(false);
        console.log("✅ AccessToken y DeviceDataCollectionUrl disponibles para Paso 4");
        hasTriedSubmitRef.current = false; // Resetear para permitir submit
      }
    } else if (!accessToken && !deviceDataCollectionUrl) {
      setError("No se recibió el formulario de autenticación del Paso 4");
      setLoading(false);
    }
  }, [searchParams, accessToken, deviceDataCollectionUrl]);

  // Escuchar mensajes del iframe (Cardinal Commerce)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log TODOS los mensajes para debugging (no solo los de Cardinal Commerce)
      console.log("=== 📨 Mensaje recibido (Paso 4) ===");
      console.log("Origin:", event.origin);
      console.log("Data type:", typeof event.data);
      console.log("Data:", event.data);
      
      // Parsear el mensaje primero para verificar si es válido
      let data: any;
      try {
        if (typeof event.data === "string") {
          try {
            data = JSON.parse(event.data);
          } catch (e) {
            // Si no es JSON, puede ser un string directo
            data = event.data;
          }
        } else {
          data = event.data;
        }
      } catch (e) {
        console.log("⚠️ Error al parsear mensaje, ignorando:", e);
        return;
      }

      // Verificar si el mensaje es profile.completed con Status: true
      const status = data.Status !== undefined ? data.Status : data.status;
      const messageType = data.MessageType || data.messageType;
      const isProfileCompleted = 
        (messageType === "profile.completed" || messageType === "ProfileCompleted" || messageType === "Profile.Completed") &&
        (status === true || status === "true" || status === "SUCCESS" || status === "Success");
      
      // Orígenes permitidos: Cardinal Commerce Y nuestro propio servidor (para el callback API route)
      const allowedOrigins = [
        "https://centinelapistag.cardinalcommerce.com",
        "https://centinelapi.cardinalcommerce.com",
        "https://songbird.cardinalcommerce.com",
      ];
      
      // También permitir mensajes del origen propio si es profile.completed (viene del callback API route)
      const isOwnOrigin = 
        event.origin.includes("localhost") || 
        event.origin.includes("ngrok") || 
        event.origin.includes("127.0.0.1") ||
        event.origin === window.location.origin;
      
      const isAllowedOrigin = allowedOrigins.some(origin => event.origin.startsWith(origin));
      const isAllowedOwnOrigin = isOwnOrigin && isProfileCompleted;
      
      if (!isAllowedOrigin && !isAllowedOwnOrigin) {
        console.log("⚠️ Origen no permitido, ignorando mensaje:", event.origin);
        return;
      }

      console.log("=== ✅ Mensaje procesado (Paso 4) ===");
      console.log("MessageType:", messageType);
      console.log("Status:", status);
      console.log("Data completa:", JSON.stringify(data, null, 2));
      console.log("Origen:", isAllowedOrigin ? "Cardinal Commerce" : "Callback API Route (propio)");
      
      // Usar isProfileCompleted que ya calculamos antes
      if (isProfileCompleted) {
        console.log("✅ Step-Up (Paso 4) completado exitosamente");
        console.log("Status:", status);
        console.log("MessageType:", messageType);
        
        // Prevenir múltiples redirecciones
        if (redirectingRef.current) {
          console.log("⚠️ Redirección ya en progreso, ignorando...");
          return;
        }
        redirectingRef.current = true;
        
        // Espera reducida (5 seg) para que Cardinal notifique a NeoPay - antes 15s parecía que no avanzaba
        const SEGUNDOS_ESPERA = 5;
        setCountdown(SEGUNDOS_ESPERA);
        console.log(`⏳ Redirigiendo en ${SEGUNDOS_ESPERA} segundos (Paso 4)...`);
        
        let segundosRestantes = SEGUNDOS_ESPERA;
        const intervalId = setInterval(() => {
          segundosRestantes -= 1;
          setCountdown(segundosRestantes);
          if (segundosRestantes <= 0) {
            clearInterval(intervalId);
            countdownIntervalRef.current = null;
            console.log("✅ Redirigiendo al callback para proceder con Paso 5...");
            if (ordenId && referenceId) {
              redirectingRef.current = false;
              router.push(
                `/pago/3dsecure/callback-page?ordenId=${ordenId}&referenceId=${referenceId}&systemsTraceNo=${systemsTraceNo || ""}&paso=5`
              );
            }
          }
        }, 1000);
        countdownIntervalRef.current = intervalId;
      } 
      // Verificar si hay error o fallo
      else if (status === "FAILURE" || status === "ERROR" || status === "Error" || 
               (messageType && (messageType.includes("error") || messageType.includes("Error") || messageType.includes("failure")))) {
        console.error("❌ Autenticación Paso 4 fallida:", data);
        setError("La autenticación adicional (Paso 4) falló. Por favor intenta nuevamente.");
      } 
      // Otros mensajes intermedios
      else {
        console.log("ℹ️ Estado intermedio - MessageType:", messageType, "Status:", status);
      }
    };

    window.addEventListener("message", handleMessage);
    console.log("✅ Listener de mensajes configurado para Cardinal Commerce (Paso 4)");
    console.log("📡 Escuchando mensajes de todos los orígenes para debugging...");
    
    return () => {
      window.removeEventListener("message", handleMessage);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      console.log("Listener de mensajes removido");
    };
  }, [ordenId, referenceId, systemsTraceNo, router]);

  // Auto-submit cuando los elementos estén montados y los datos estén disponibles
  // Usar useRef para prevenir múltiples ejecuciones
  const hasTriedSubmitRef = useRef(false);
  
  useEffect(() => {
    if (!accessToken || !deviceDataCollectionUrl || hasTriedSubmitRef.current) {
      return;
    }

    // Resetear la bandera cuando cambian los parámetros
    formSubmittedRef.current = false;
    hasTriedSubmitRef.current = true; // Marcar como intentado

    // Variables para cleanup
    let rafId1: number | null = null;
    let rafId2: number | null = null;
    let timeout1: NodeJS.Timeout | null = null;
    let timeout2: NodeJS.Timeout | null = null;

    // Función para verificar y enviar
    const trySubmit = () => {
      const form = formRef.current;
      const iframe = iframeRef.current;
      
      console.log("🔍 Verificando elementos (Paso 4):", {
        form: !!form,
        iframe: !!iframe,
        formInDOM: form ? document.contains(form) : false,
        iframeInDOM: iframe ? document.contains(iframe) : false,
        formSubmitted: formSubmittedRef.current,
      });
      
      if (form && iframe && document.contains(form) && document.contains(iframe) && !formSubmittedRef.current) {
        console.log("✅ Formulario e iframe encontrados en el DOM (Paso 4), enviando...");
        console.log("Form action:", form.action);
        console.log("Form target:", form.target);
        console.log("AccessToken (primeros 50 chars):", accessToken.substring(0, 50) + "...");
        console.log("DeviceDataCollectionUrl:", deviceDataCollectionUrl);
        
        try {
          formSubmittedRef.current = true;
          form.submit();
          console.log("✅ Formulario Paso 4 enviado exitosamente desde useEffect");
          return true;
        } catch (e) {
          console.error("❌ Error al enviar formulario Paso 4 desde useEffect:", e);
          formSubmittedRef.current = false;
          return false;
        }
      }
      return false;
    };

    // Intentar inmediatamente
    if (trySubmit()) {
      return;
    }

    // Si no están listos, usar requestAnimationFrame para esperar al siguiente ciclo de renderizado
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        if (trySubmit()) {
          return;
        }

        // Si aún no están listos, intentar después de delays progresivos
        timeout1 = setTimeout(() => {
          if (trySubmit()) {
            return;
          }
          
          timeout2 = setTimeout(() => {
            if (!trySubmit()) {
              console.error("❌ No se pudieron encontrar el formulario o el iframe después de múltiples intentos (Paso 4)");
              setError("No se pudo cargar el formulario de autenticación adicional. Por favor, intenta nuevamente.");
            }
          }, 1000);
        }, 500);
      });
    });

    // Cleanup
    return () => {
      if (rafId1 !== null) cancelAnimationFrame(rafId1);
      if (rafId2 !== null) cancelAnimationFrame(rafId2);
      if (timeout1) clearTimeout(timeout1);
      if (timeout2) clearTimeout(timeout2);
    };
  }, [accessToken, deviceDataCollectionUrl]);

  if (loading || !serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Procesando autenticación adicional (Paso 4)...</p>
            <p className="text-gray-600">Cardinal Commerce está verificando tu tarjeta. Por favor espera...</p>
          </div>
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
              Autenticación Adicional (Paso 4)
            </h1>
            <p className="text-gray-600 mb-6">
              Por favor, completa la autenticación adicional de tu tarjeta (PIN).
            </p>
            
            {/* Contenedor para el formulario Paso 4 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {accessToken && deviceDataCollectionUrl ? (
                <>
                  {/* Formulario oculto que se auto-submitea al iframe */}
                  <form
                    ref={formRef}
                    id="step_up_form"
                    name="stepup"
                    method="POST"
                    target="stepUpIframe"
                    action={deviceDataCollectionUrl}
                    style={{ display: "none" }}
                  >
                    <input type="hidden" name="JWT" value={accessToken} />
                  </form>
                  
                  {/* Iframe visible según el manual (PaymentForm.html) para Step-Up */}
                  <iframe
                    ref={iframeRef}
                    id="step_up_iframe"
                    name="stepUpIframe"
                    height="800"
                    width="100%"
                    style={{ border: "none", marginLeft: "auto", marginRight: "auto", display: "block" }}
                    title="3D Secure Step-Up Authentication"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    onLoad={() => {
                      console.log("✅ Iframe Paso 4 cargado");
                      console.log("Iframe src:", iframeRef.current?.src || "No src (formulario POST)");
                      
                      // Prevenir múltiples submits usando la bandera
                      if (formSubmittedRef.current) {
                        console.log("⚠️ Formulario ya fue enviado, ignorando onLoad adicional");
                        return;
                      }
                      
                      // Intentar hacer submit cuando el iframe esté listo (solo una vez)
                      const form = formRef.current;
                      if (form && document.contains(form)) {
                        console.log("=== Enviando formulario Paso 4 al iframe (desde onLoad) ===");
                        console.log("Form action:", form.action);
                        console.log("Form target:", form.target);
                        console.log("Form method:", form.method);
                        console.log("AccessToken (primeros 50 chars):", accessToken.substring(0, 50) + "...");
                        console.log("DeviceDataCollectionUrl:", deviceDataCollectionUrl);
                        
                        try {
                          formSubmittedRef.current = true; // Marcar como enviado ANTES de hacer submit
                          form.submit();
                          console.log("✅ Formulario Paso 4 enviado exitosamente al iframe (desde onLoad)");
                        } catch (e) {
                          console.error("❌ Error al enviar formulario Paso 4 (desde onLoad):", e);
                          formSubmittedRef.current = false; // Permitir reintento si hay error
                        }
                      } else {
                        console.warn("⚠️ Formulario no disponible en onLoad del iframe");
                        console.warn("Form ref:", form);
                        console.warn("Form in DOM:", form ? document.contains(form) : false);
                      }
                    }}
                    onError={(e) => {
                      console.error("❌ Error al cargar iframe Paso 4:", e);
                    }}
                  />
                  
                  {/* Mensaje mientras se procesa */}
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p className="text-gray-600">
                      {countdown !== null
                        ? `Autenticación completada. Redirigiendo en ${countdown} segundos...`
                        : "Procesando autenticación adicional (Paso 4)..."}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {countdown !== null
                        ? "Cardinal Commerce verificó tu tarjeta. Procediendo a confirmar el pago..."
                        : "Cardinal Commerce está verificando tu tarjeta. Por favor espera..."}
                    </p>
                  </div>
                </>
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

export default function ThreeDSecurePaso4Page() {
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
      <ThreeDSecurePaso4Content />
    </Suspense>
  );
}

