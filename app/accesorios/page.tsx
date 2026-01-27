import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import ProductGrid from "@/components/catalog/ProductGrid";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Accesorios",
  description: "Explora nuestro catálogo de accesorios. Filtra por marca, precio y características. Encuentra el accesorio perfecto para ti.",
};

export default async function AccesoriosPage() {
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

  // Obtener accesorios activos
  const accesorios = await prisma.accesorio.findMany({
    where: {
      activo: true,
    },
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
      },
      colores: {
        include: {
          color: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Formatear productos para el grid (solo accesorios)
  const productos = accesorios.map((accesorio) => ({
    id: accesorio.id,
    tipo: "accesorio" as const,
    modelo: accesorio.modelo,
    marca: accesorio.marca.nombre,
    marcaId: accesorio.marca.id,
    precio: Number(accesorio.precio),
    precioMax: Number(accesorio.precio),
    imagenes: accesorio.imagenes.map(img => img.url),
    tieneVariantes: false,
  }));

  // Extraer solo las marcas que tienen accesorios
  const marcasUnicas = new Map<number, { id: number; nombre: string }>();
  accesorios.forEach((accesorio) => {
    if (!marcasUnicas.has(accesorio.marca.id)) {
      marcasUnicas.set(accesorio.marca.id, {
        id: accesorio.marca.id,
        nombre: accesorio.marca.nombre,
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Accesorios</h1>
          
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
