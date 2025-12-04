"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validar cantidad de imágenes
    if (images.length + files.length > maxImages) {
      setUploadError(`Solo puedes subir hasta ${maxImages} imágenes en total`);
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validar tipo de archivo
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} no es una imagen válida`);
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} es demasiado grande (máximo 5MB)`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Error al subir ${file.name}`);
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
    } catch (error: any) {
      setUploadError(error.message || "Error al subir las imágenes");
    } finally {
      setUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Crear un evento de cambio simulado
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    const fakeEvent = {
      target: { files: dataTransfer.files },
    } as any;

    handleFileSelect(fakeEvent);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imágenes del Producto
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Puedes subir hasta {maxImages} imágenes. Formatos: JPEG, PNG, WEBP (máx. 5MB cada una)
        </p>

        {/* Área de drop */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || images.length >= maxImages}
          />
          {uploading ? (
            <div className="text-sm text-gray-600">Subiendo imágenes...</div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {images.length} / {maxImages} imágenes
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-2 rounded-md bg-red-50 border-2 border-red-300 p-3">
            <p className="text-sm font-bold text-red-950">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes Subidas ({images.length})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Eliminar imagen"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

