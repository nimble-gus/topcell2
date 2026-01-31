import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Evitar empaquetar pdfkit: usa fs.readFileSync(__dirname + '/data/*.afm')
  // y en el bundle __dirname apunta a .next/server/vendor-chunks donde no existen los .afm
  serverExternalPackages: ["pdfkit"],
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
