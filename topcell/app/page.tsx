import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";

export default async function Home() {
  // Obtener logo
  const logoContent = await prisma.contenidoTienda.findFirst({
    where: {
      tipo: "logo",
      activo: true,
    },
    orderBy: {
      orden: "asc",
    },
  });

  // Obtener imágenes del hero
  const heroImages = await prisma.contenidoTienda.findMany({
    where: {
      tipo: "hero",
      activo: true,
    },
    orderBy: [
      { orden: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Obtener teléfonos destacados
  const telefonosDestacados = await prisma.telefonoNuevo.findMany({
    where: {
      featured: true,
      activo: true,
    },
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
        take: 1, // Solo la primera imagen
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8, // Limitar a 8 productos destacados
  });

  // Obtener accesorios destacados
  const accesoriosDestacados = await prisma.accesorio.findMany({
    where: {
      featured: true,
      activo: true,
    },
    include: {
      marca: true,
      imagenes: {
        orderBy: { orden: "asc" },
        take: 1, // Solo la primera imagen
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8, // Limitar a 8 productos destacados
  });

  // Agrupar teléfonos por marca
  const telefonosPorMarca = telefonosDestacados.reduce((acc, telefono) => {
    const marcaId = telefono.marca.id;
    if (!acc[marcaId]) {
      acc[marcaId] = {
        marca: {
          id: telefono.marca.id,
          nombre: telefono.marca.nombre,
          logoUrl: telefono.marca.logoUrl,
        },
        telefonos: [],
      };
    }
    acc[marcaId].telefonos.push({
      id: telefono.id,
      modelo: telefono.modelo,
      precio: Number(telefono.precio),
      imagenUrl:
        telefono.imagenes.length > 0
          ? telefono.imagenes[0].url
          : "/placeholder-phone.jpg",
      marca: {
        id: telefono.marca.id,
        nombre: telefono.marca.nombre,
        logoUrl: telefono.marca.logoUrl,
      },
    });
    return acc;
  }, {} as Record<number, { marca: { id: number; nombre: string; logoUrl: string | null }; telefonos: any[] }>);

  // Convertir a array y filtrar solo marcas con logo
  const marcasConTelefonos = Object.values(telefonosPorMarca).filter(
    (grupo) => grupo.marca.logoUrl !== null
  );

  return (
    <div className="min-h-screen bg-white">
      <Header logoUrl={logoContent?.url || null} />
      
      <main className="pt-20">
        {/* Hero Section */}
        <HeroSection
          images={heroImages.map((img) => ({
            id: img.id,
            url: img.url,
            descripcion: img.descripcion,
            orden: img.orden,
          }))}
        />

        {/* Featured Section */}
        <FeaturedSection
          telefonosPorMarca={marcasConTelefonos}
          accesorios={accesoriosDestacados.map((accesorio) => ({
            id: accesorio.id,
            modelo: accesorio.modelo,
            descripcion: accesorio.descripcion,
            precio: Number(accesorio.precio),
            imagenUrl:
              accesorio.imagenes.length > 0
                ? accesorio.imagenes[0].url
                : "/placeholder-accessory.jpg",
            marca: {
              id: accesorio.marca.id,
              nombre: accesorio.marca.nombre,
              logoUrl: accesorio.marca.logoUrl,
            },
          }))}
        />

        {/* Resto del contenido de la página */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center rounded-2xl bg-gradient-to-br from-gray-50 to-white p-12 border border-gray-100">
            <p className="text-gray-600 font-medium">No hay contenido disponible.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
