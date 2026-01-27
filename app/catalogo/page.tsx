import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import ProductGrid from "@/components/catalog/ProductGrid";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Teléfonos Nuevos",
  description: "Explora nuestro catálogo de teléfonos nuevos. Filtra por marca, precio y características. Encuentra el dispositivo perfecto para ti.",
};

export default async function CatalogoPage() {
  // Obtener logo para el header
  const logoContent = await prisma.contenidoTienda.findFirst({
    where: {
      tipo: "logo",
      activo: true,
    },
    orderBy: {
      orden: "asc",
    },
  });

  // Obtener datos del footer
  const footerData = await prisma.contenidoTienda.findMany({
    where: {
      tipo: {
        in: [
          "footer-email",
          "footer-telefono",
          "footer-facebook",
          "footer-instagram",
          "footer-tiktok",
          "footer-servicio",
          "footer-link-conocenos",
          "footer-link-privacidad",
          "footer-link-terminos",
        ],
      },
      activo: true,
    },
    orderBy: [
      { tipo: "asc" },
      { orden: "asc" },
    ],
  });

  // Extraer datos del footer
  const footerEmail = footerData.find((item) => item.tipo === "footer-email")?.descripcion || null;
  const footerTelefono = footerData.find((item) => item.tipo === "footer-telefono")?.descripcion || null;
  const footerFacebook = footerData.find((item) => item.tipo === "footer-facebook")?.urlDestino || null;
  const footerInstagram = footerData.find((item) => item.tipo === "footer-instagram")?.urlDestino || null;
  const footerTiktok = footerData.find((item) => item.tipo === "footer-tiktok")?.urlDestino || null;
  const footerServicios = footerData
    .filter((item) => item.tipo === "footer-servicio")
    .map((item) => item.descripcion || "")
    .filter((s) => s.length > 0);
  const footerLinkConocenos = footerData.find((item) => item.tipo === "footer-link-conocenos")?.urlDestino || null;
  const footerLinkPrivacidad = footerData.find((item) => item.tipo === "footer-link-privacidad")?.urlDestino || null;
  const footerLinkTerminos = footerData.find((item) => item.tipo === "footer-link-terminos")?.urlDestino || null;

  // Obtener productos activos (solo teléfonos nuevos, NO accesorios ni seminuevos)
  const telefonosNuevos = await prisma.telefonoNuevo.findMany({
    where: {
      activo: true,
    },
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
      },
      variantes: {
        include: {
          color: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Formatear productos para el grid (solo teléfonos nuevos)
  const productos = telefonosNuevos.map((telefono) => {
    // Para teléfonos nuevos, cada variante tiene su propio precio
    const precios = telefono.variantes.length > 0
      ? telefono.variantes.map(v => Number(v.precio))
      : [Number(telefono.precio)];
    const precio = Math.min(...precios);
    const precioMax = Math.max(...precios);
    return {
      id: telefono.id,
      tipo: "telefono-nuevo" as const,
      modelo: telefono.modelo,
      marca: telefono.marca.nombre,
      marcaId: telefono.marca.id,
      precio: precio,
      precioMax: precioMax,
      imagenes: telefono.imagenes.map(img => img.url),
      tieneVariantes: telefono.variantes.length > 0,
    };
  });

  // Extraer solo las marcas que tienen teléfonos nuevos
  const marcasUnicas = new Map<number, { id: number; nombre: string }>();
  telefonosNuevos.forEach((telefono) => {
    if (!marcasUnicas.has(telefono.marca.id)) {
      marcasUnicas.set(telefono.marca.id, {
        id: telefono.marca.id,
        nombre: telefono.marca.nombre,
      });
    }
  });
  const marcas = Array.from(marcasUnicas.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Teléfonos Nuevos</h1>
          
          <Suspense fallback={<div className="text-center py-12">Cargando catálogo...</div>}>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filtros */}
              <aside className="lg:w-64 flex-shrink-0">
                <CatalogFilters marcas={marcas} />
              </aside>

              {/* Grid de productos */}
              <div className="flex-1">
                <ProductGrid productos={productos} />
              </div>
            </div>
          </Suspense>
        </div>
      </main>

      <Footer
        logoUrl={logoContent?.url || null}
        email={footerEmail}
        telefono={footerTelefono}
        facebookUrl={footerFacebook}
        instagramUrl={footerInstagram}
        tiktokUrl={footerTiktok}
        servicios={footerServicios}
        linkConocenos={footerLinkConocenos}
        linkPrivacidad={footerLinkPrivacidad}
        linkTerminos={footerLinkTerminos}
      />
    </div>
  );
}

