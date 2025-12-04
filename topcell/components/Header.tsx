"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
// El Header usa la sesión de la tienda (store), no admin

interface HeaderProps {
  logoUrl?: string | null;
}

export default function Header({ logoUrl }: HeaderProps) {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  
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
        <div className="flex h-20 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="TOPCELL TELECOMUNICACIONES"
                  width={180}
                  height={60}
                  className="h-auto w-auto object-contain rounded-lg"
                  priority
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    <span className="text-orange-500">TOP</span>
                    <span className="text-black">CELL</span>
                  </span>
                  <span className="text-xs text-black">TELECOMUNICACIONES</span>
                </div>
              )}
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors rounded-lg px-3 py-2 hover:bg-orange-50"
            >
              Catálogo
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

          {/* Right: Cart and User */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            <Link
              href="/carrito"
              className="relative p-2.5 text-gray-700 hover:text-orange-500 transition-all rounded-full hover:bg-orange-50"
              aria-label="Carrito de compras"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </Link>

            {/* User Icon / Login Button */}
            {/* Solo mostrar sesión si es de tipo "user" (no admin) */}
            {storeSession ? (
              <div className="relative group">
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
                      href="/perfil"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors rounded-lg mx-2"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/ordenes"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors rounded-lg mx-2"
                    >
                      Mis Órdenes
                    </Link>
                    <button
                      onClick={() => signOut()}
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
                className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

