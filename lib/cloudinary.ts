import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Sube una imagen a Cloudinary
 * @param file - Buffer o base64 de la imagen
 * @param folder - Carpeta donde se guardará (opcional)
 * @param publicId - ID público personalizado (opcional)
 * @returns URL de la imagen subida
 */
export async function uploadImage(
  file: Buffer | string,
  folder?: string,
  publicId?: string
): Promise<string> {
  try {
    const uploadOptions: any = {
      resource_type: "image" as const,
    };

    if (folder) {
      uploadOptions.folder = folder;
    }

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    let uploadResult;
    if (Buffer.isBuffer(file)) {
      // Para buffers, usar upload_stream con promesa
      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file);
      });
    } else {
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    }

    return (uploadResult as any).secure_url;
  } catch (error) {
    console.error("Error subiendo imagen a Cloudinary:", error);
    throw new Error("Error al subir la imagen");
  }
}

/**
 * Elimina una imagen de Cloudinary
 * @param publicId - ID público de la imagen a eliminar
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error eliminando imagen de Cloudinary:", error);
    throw new Error("Error al eliminar la imagen");
  }
}

/**
 * Obtiene la URL de una imagen con transformaciones
 * @param publicId - ID público de la imagen
 * @param transformations - Transformaciones a aplicar (opcional)
 * @returns URL de la imagen transformada
 */
export function getImageUrl(
  publicId: string,
  transformations?: Record<string, any>
): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
}

