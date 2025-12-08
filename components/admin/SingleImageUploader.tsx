"use client";

import { useState, useRef } from "react";

interface SingleImageUploaderProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  folder?: string; // Carpeta opcional en Cloudinary
}

export default function SingleImageUploader({
  imageUrl,
  onImageChange,
  folder = "productos",
}: SingleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setUploadError("El archivo debe ser una imagen");
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("El archivo es demasiado grande (máximo 5MB)");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) {
        formData.append("folder", folder);
      }

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al subir la imagen");
      }

      const data = await response.json();
      onImageChange(data.url);
    } catch (error: any) {
      setUploadError(error.message || "Error al subir la imagen");
    } finally {
      setUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Crear un evento de cambio simulado
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fakeEvent = {
      target: { files: dataTransfer.files },
    } as any;

    handleFileSelect(fakeEvent);
  };

  return (
    <div className="space-y-4">
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
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        {uploading ? (
          <div className="text-sm text-gray-600">Subiendo imagen...</div>
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
              PNG, JPG, WEBP hasta 5MB
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="rounded-md bg-red-50 border-2 border-red-300 p-3">
          <p className="text-sm font-bold text-red-950">{uploadError}</p>
        </div>
      )}

      {/* Vista previa de la imagen */}
      {imageUrl && (
        <div className="relative">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt="Logo de la marca"
              className="h-32 w-32 rounded-lg object-contain border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
              title="Eliminar logo"
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
          </div>
        </div>
      )}
    </div>
  );
}

