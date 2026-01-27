"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { getCartItemsCount } from "@/lib/cart";
// El Header usa la sesión de la tienda (store), no admin

interface HeaderProps {
  logoUrl?: string | null;
}

export default function Header({ logoUrl }: HeaderProps) {
  const { data: session } = useSession();
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      setCartItemsCount(getCartItemsCount());
    };
    
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Filtrar sesiones: solo mostrar si es de tipo "user" (no admin)
  // Esto previene que admins vean su sesión en la tienda
  const storeSession = session?.user && (session.user as any)?.type === "user" ? session : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-lg shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="TOPCELL TELECOMUNICACIONES"
                  width={180}
                  height={60}
                  className="h-10 sm:h-12 md:h-14 w-auto object-contain rounded-lg"
                  priority
                />
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                  <span className="text-xl sm:text-2xl font-bold">
                    <span className="text-orange-500">TOP</span>
                    <span className="text-black">CELL</span>
                  </span>
                  <span className="text-[10px] sm:text-xs text-black">TELECOMUNICACIONES</span>
                </div>
              )}
            </Link>
          </div>

          {/* Center: Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors rounded-lg px-3 py-2 hover:bg-orange-50"
            >
              Nuevos
            </Link>
            <Link
              href="/seminuevos"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors rounded-lg px-3 py-2 hover:bg-orange-50"
            >
              Seminuevos
            </Link>
            <Link
              href="/accesorios"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors rounded-lg px-3 py-2 hover:bg-orange-50"
            >
              Accesorios
            </Link>
            <Link
              href="/ubicaciones"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors rounded-lg px-3 py-2 hover:bg-orange-50"
            >
              Ubicaciones
            </Link>
            <Link
              href="/mayoristas"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors rounded-lg px-3 py-2 hover:bg-orange-50"
            >
              Mayoristas
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50"
            aria-label="Menú"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Right: Cart and User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Icon */}
            <Link
              href="/carrito"
              className="relative p-2 sm:p-2.5 text-gray-700 hover:text-orange-500 transition-all rounded-full hover:bg-orange-50"
              aria-label="Carrito de compras"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
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
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-orange-500 text-white text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {cartItemsCount > 9 ? "9+" : cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Icon / Login Button - Desktop */}
            {/* Solo mostrar sesión si es de tipo "user" (no admin) */}
            {storeSession ? (
              <div className="hidden md:block relative group">
                <button
                  className="p-2.5 text-gray-700 hover:text-orange-500 transition-all rounded-full hover:bg-orange-50"
                  aria-label="Mi cuenta"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white/95 backdrop-blur-md shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <div className="py-1">
                    <Link
                      href="/mi-cuenta"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors rounded-lg mx-2"
                    >
                      Mi Cuenta
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors rounded-lg mx-2"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block rounded-full bg-orange-500 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <nav className="px-4 py-4 space-y-2">
              <Link
                href="/catalogo"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Nuevos
              </Link>
              <Link
                href="/seminuevos"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Seminuevos
              </Link>
              <Link
                href="/accesorios"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accesorios
              </Link>
              <Link
                href="/ubicaciones"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ubicaciones
              </Link>
              <Link
                href="/mayoristas"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mayoristas
              </Link>
              {storeSession ? (
                <>
                  <Link
                    href="/mi-cuenta"
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mi Cuenta
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-4 py-3 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

