// Este archivo solo debe usarse en el servidor
import "server-only";

import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const adminAuthOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      id: "admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Credenciales faltantes (admin)");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // Buscar administrador en la base de datos
          const admin = await prisma.usuarioAdmin.findUnique({
            where: {
              email: email,
            },
          });

          if (!admin) {
            console.log(`❌ Admin no encontrado: ${email}`);
            return null;
          }

          if (!admin.activo) {
            console.log(`❌ Admin inactivo: ${email}`);
            return null;
          }

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(
            password,
            admin.passwordHash
          );

          if (!isValidPassword) {
            console.log(`❌ Contraseña incorrecta para admin: ${email}`);
            return null;
          }

          // Actualizar último login
          await prisma.usuarioAdmin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() },
          });

          console.log(`✅ Login exitoso para admin: ${admin.email}`);

          // Retornar información del administrador
          return {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.nombre,
            role: admin.rol,
            type: "admin", // Identificador para distinguir de usuarios normales
          };
        } catch (error) {
          console.error("❌ Error en authorize (admin):", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  // Usar cookie name diferente para admin
  // NOTA: En desarrollo, no usar __Secure- porque requiere HTTPS
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.admin.session-token`
        : `next-auth.admin.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.type = (user as any).type;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).type = token.type;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Exportar la función auth() para usar en componentes del servidor
export const { handlers: adminHandlers, auth: adminAuth, signIn: adminSignIn, signOut: adminSignOut } = NextAuth(adminAuthOptions);

    