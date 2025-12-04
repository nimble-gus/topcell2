"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
// El Sidebar usa la sesión de admin

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Productos Nuevos", href: "/admin/productos/nuevos", icon: "📱" },
  { name: "Productos Seminuevos", href: "/admin/productos/seminuevos", icon: "📱" },
  { name: "Accesorios", href: "/admin/productos/accesorios", icon: "🎧" },
  { name: "Marcas", href: "/admin/catalogo/marcas", icon: "🏷️" },
  { name: "Colores", href: "/admin/catalogo/colores", icon: "🎨" },
  { name: "Contenido", href: "/admin/contenido", icon: "🖼️" },
  { name: "Ubicaciones", href: "/admin/ubicaciones", icon: "📍" },
  { name: "Órdenes", href: "/admin/ordenes", icon: "📦" },
  { name: "Usuarios", href: "/admin/usuarios", icon: "👥" },
  { name: "Inventario", href: "/admin/inventario", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-white">TopCell Admin</h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`${
                          isActive
                            ? "bg-gray-800 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <span className="text-lg">🚪</span>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

