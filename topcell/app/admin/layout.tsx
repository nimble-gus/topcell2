import { adminAuth } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminSessionProvider from "@/components/providers/AdminSessionProvider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // En NextAuth v5, se usa adminAuth() directamente para admin
  // adminAuth() automáticamente lee las cookies del request
  const session = await adminAuth();
  
  // Si no hay sesión, simplemente renderizar children sin el layout de admin
  // El layout de login manejará su propio contenido
  // Esto evita el bucle de redirección
  if (!session) {
    // Renderizar solo los children (el layout de login se encargará del resto)
    return <>{children}</>;
  }
  
  // Verificar que la sesión es de tipo admin
  if ((session.user as any)?.type !== "admin") {
    return <>{children}</>;
  }

  // Si hay sesión, renderizar el layout completo de admin
  return (
    <AdminSessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64">
          <Header user={session.user} />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminSessionProvider>
  );
}

