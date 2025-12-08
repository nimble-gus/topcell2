import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/auth-admin";
import StatsCard from "@/components/admin/StatsCard";

export default async function AdminDashboard() {
  // Obtener estadísticas básicas - Resolver todas las promises primero
  const [
    countNuevos,
    countSeminuevos,
    countAccesorios,
    totalOrdenes,
    ordenesPendientes,
    stockBajoNuevos,
    stockBajoSeminuevos,
    stockBajoAccesorios,
  ] = await Promise.all([
    prisma.telefonoNuevo.count({ where: { activo: true } }),
    prisma.telefonoSeminuevo.count({ where: { activo: true } }),
    prisma.accesorio.count({ where: { activo: true } }),
    prisma.orden.count(),
    prisma.orden.count({ where: { estado: "PENDIENTE" } }),
    prisma.telefonoNuevo.count({ where: { stock: { lt: 10 }, activo: true } }),
    prisma.telefonoSeminuevo.count({ where: { stock: { lt: 10 }, activo: true } }),
    prisma.accesorio.count({ where: { stock: { lt: 10 }, activo: true } }),
  ]);

  const totalProductos = countNuevos + countSeminuevos + countAccesorios;
  const productosBajoStock = stockBajoNuevos + stockBajoSeminuevos + stockBajoAccesorios;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Resumen general de la tienda
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Productos"
          value={totalProductos}
          description="Productos activos"
        />
        <StatsCard
          title="Total Órdenes"
          value={totalOrdenes}
          description="Todas las órdenes"
        />
        <StatsCard
          title="Órdenes Pendientes"
          value={ordenesPendientes}
          description="Requieren atención"
          variant="warning"
        />
        <StatsCard
          title="Stock Bajo"
          value={productosBajoStock}
          description="Productos con stock < 10"
          variant="danger"
        />
      </div>
    </div>
  );
}

