// Este archivo solo debe usarse en el servidor
import "server-only";

import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const storeAuthOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      id: "store-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Credenciales faltantes (store)");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // Buscar usuario en la base de datos (NO admin)
          const usuario = await prisma.usuario.findUnique({
            where: {
              email: email,
            },
          });

          if (!usuario) {
            console.log(`❌ Usuario no encontrado: ${email}`);
            return null;
          }

          if (!usuario.activo) {
            console.log(`❌ Usuario inactivo: ${email}`);
            return null;
          }

          // NOTA: Los usuarios de la tienda necesitarán tener passwordHash en el futuro
          // Por ahora, si no tienen contraseña, no pueden hacer login
          // Esto se implementará cuando se cree el sistema de registro de usuarios
          
          // Por ahora, retornamos null si no hay sistema de contraseñas para usuarios
          // TODO: Implementar hash de contraseñas para usuarios cuando se cree el registro
          
          console.log(`✅ Login exitoso para usuario: ${usuario.email}`);

          // Retornar información del usuario
          return {
            id: usuario.id.toString(),
            email: usuario.email,
            name: usuario.nombre,
            type: "user", // Identificador para distinguir de admins
          };
        } catch (error) {
          console.error("❌ Error en authorize (store):", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  // Usar cookie name diferente para usuarios de la tienda
  // NOTA: En desarrollo, no usar __Secure- porque requiere HTTPS
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.store.session-token`
        : `next-auth.store.session-token`,
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
        token.type = (user as any).type;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).type = token.type;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET_STORE || process.env.NEXTAUTH_SECRET, // Puedes usar un secret diferente
};

// Exportar la función auth() para usar en componentes del servidor
export const { handlers: storeHandlers, auth: storeAuth, signIn: storeSignIn, signOut: storeSignOut } = NextAuth(storeAuthOptions);

