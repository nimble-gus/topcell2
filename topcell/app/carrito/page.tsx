"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  getCartTotal,
  clearCart,
  type CartItem,
} from "@/lib/cart";

export default function CarritoPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadCart();
    loadServerData();
    
    // Escuchar cambios en el carrito
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
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

  const loadCart = () => {
    const cartData = getCart();
    setCart(cartData);
    setLoading(false);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    loadCart();
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    updateCartItemQuantity(itemId, newQuantity);
    loadCart();
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    // Redirigir a checkout con los datos del carrito
    router.push("/checkout");
  };

  const subtotal = getCartTotal();
  const envio = 0; // Por ahora sin envío
  const total = subtotal + envio;

  if (loading || !serverData) {
    return (
      <div className="min-h-screen bg-white">
        <Header logoUrl={null} />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={serverData.logoUrl} />
      
      <main className="pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Carrito de Compras</h1>

          {cart.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-6">
                Agrega productos para comenzar tu compra
              </p>
              <Link
                href="/catalogo"
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Lista de productos */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {/* Imagen */}
                      <div className="relative w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.imagen || "/placeholder-phone.jpg"}
                          alt={`${item.marca} ${item.modelo}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">{item.marca}</p>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                              {item.modelo}
                            </h3>
                            
                            {/* Detalles de la variante */}
                            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                              {item.color && (
                                <p>
                                  <span className="font-medium">Color:</span> {item.color}
                                </p>
                              )}
                              {item.rom && (
                                <p>
                                  <span className="font-medium">Almacenamiento:</span> {item.rom}
                                </p>
                              )}
                              {item.estado !== undefined && (
                                <p>
                                  <span className="font-medium">Estado:</span> {item.estado}/10
                                </p>
                              )}
                              {item.porcentajeBateria !== null && item.porcentajeBateria !== undefined && (
                                <p>
                                  <span className="font-medium">Batería:</span> {item.porcentajeBateria}%
                                </p>
                              )}
                              {item.ciclosCarga !== null && item.ciclosCarga !== undefined && (
                                <p>
                                  <span className="font-medium">Ciclos de carga:</span> {item.ciclosCarga}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Precio y eliminar */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              aria-label="Eliminar producto"
                            >
                              <svg
                                className="w-5 h-5"
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
                            </button>
                            <div className="text-right">
                              <p className="text-lg sm:text-xl font-bold text-orange-500">
                                Q{(item.precio * item.cantidad).toLocaleString("es-GT")}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                Q{item.precio.toLocaleString("es-GT")} c/u
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-4">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">
                            Cantidad:
                          </label>
                          <div className="flex items-center gap-1 sm:gap-2 border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                              disabled={item.cantidad <= 1}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>
                            <span className="px-4 py-1 text-gray-900 font-medium min-w-[3rem] text-center">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen del pedido */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-24">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Resumen del Pedido
                  </h2>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-gray-900">
                        Q{subtotal.toLocaleString("es-GT")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base text-gray-600">
                      <span>Envío:</span>
                      <span className="font-semibold text-gray-900">
                        {envio === 0 ? "Gratis" : `Q${envio.toLocaleString("es-GT")}`}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
                        <span>Total:</span>
                        <span className="text-orange-500">
                          Q{total.toLocaleString("es-GT")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 sm:py-4 bg-orange-500 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-orange-600 transition-colors mb-3 sm:mb-4"
                  >
                    Proceder al Checkout
                  </button>

                  <Link
                    href="/catalogo"
                    className="block w-full text-center py-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    ← Continuar comprando
                  </Link>
                </div>
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

