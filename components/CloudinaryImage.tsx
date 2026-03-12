"use client";

import { useState } from "react";
import { getCloudinaryOptimizedUrl, type CloudinarySize } from "@/lib/cloudinary-utils";

interface CloudinaryImageProps {
  src: string | null | undefined;
  alt: string;
  size?: CloudinarySize;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  /** Clases para el placeholder cuando hay error */
  wrapperClassName?: string;
}

/**
 * Componente de imagen optimizado para Cloudinary.
 * Usa <img> nativo para máxima compatibilidad (soluciona problemas en algunos laptops/navegadores).
 * Aplica transformaciones Cloudinary para cargar imágenes más livianas (más rápido en móvil).
 */
export default function CloudinaryImage({
  src,
  alt,
  size = "card",
  className = "",
  fill = false,
  width,
  height,
  loading = "lazy",
  wrapperClassName = "",
}: CloudinaryImageProps) {
  const [error, setError] = useState(false);

  const optimizedSrc = getCloudinaryOptimizedUrl(src, size);

  if (!optimizedSrc || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${wrapperClassName}`}
        style={
          fill
            ? { position: "absolute", inset: 0 }
            : { width: width || 64, height: height || 64 }
        }
      >
        <span className={fill ? "" : "hidden"}>Sin imagen</span>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading={loading}
      onError={() => setError(true)}
      className={fill ? `absolute inset-0 w-full h-full object-cover ${className}` : className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
    />
  );
}
