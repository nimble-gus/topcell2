import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Configurar el directorio raíz para evitar warnings de múltiples lockfiles
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Usar webpack explícitamente para tener control sobre la configuración
  // Alternativamente, puedes usar Turbopack agregando: turbopack: {}
  webpack: (config, { isServer }) => {
    // Excluir Prisma del bundle del cliente
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client": false,
        "prisma": false,
        "@/app/generated/prisma": false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
