/**
 * Utilidades para optimizar URLs de Cloudinary
 * - Reduce el tamaño de descarga (más rápido en móvil)
 * - q_auto: calidad automática
 * - f_auto: formato automático (WebP cuando el navegador lo soporte)
 */

export type CloudinarySize = "thumbnail" | "card" | "gallery" | "lightbox" | "full";

const SIZE_PRESETS: Record<CloudinarySize, string> = {
  thumbnail: "w_128,h_128,c_fill,q_auto,f_auto",
  card: "w_400,h_400,c_fill,q_auto,f_auto",
  gallery: "w_600,h_600,c_fill,q_auto,f_auto",
  lightbox: "w_700,h_700,c_limit,q_auto,f_auto", // Resolución más baja para navegar rápido
  full: "q_auto,f_auto",
};

/**
 * Obtiene una URL de Cloudinary optimizada para el tamaño indicado.
 * Si no es una URL de Cloudinary, devuelve la URL original sin modificar.
 */
export function getCloudinaryOptimizedUrl(
  url: string | null | undefined,
  size: CloudinarySize = "card"
): string {
  if (!url || typeof url !== "string") return url || "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  const transform = SIZE_PRESETS[size];
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}
