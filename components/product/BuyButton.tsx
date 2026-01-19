"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";

interface BuyButtonProps {
  tipo: "telefono-nuevo" | "telefono-seminuevo" | "accesorio";
  productoId: number;
  varianteId?: number;
  precio: number;
  stock: number;
  modelo: string;
  marca: string;
  imagen: string;
  color?: string;
  rom?: string;
  estado?: number;
  porcentajeBateria?: number | null;
  ciclosCarga?: number | null;
}

export default function BuyButton({
  tipo,
  productoId,
  varianteId,
  precio,
  stock,
  modelo,
  marca,
  imagen,
  color,
  rom,
  estado,
  porcentajeBateria,
  ciclosCarga,
}: BuyButtonProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const handleBuy = () => {
    if (stock === 0) return;
    
    setAdding(true);
    
    addToCart({
      tipo,
      productoId,
      varianteId,
      cantidad: 1,
      precio,
      modelo,
      marca,
      imagen,
      color,
      rom,
      estado,
      porcentajeBateria,
      ciclosCarga,
    });
    
    setTimeout(() => {
      setAdding(false);
      router.push("/carrito");
    }, 500);
  };

  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed mb-3"
      >
        Agotado
      </button>
    );
  }

  return (
    <button
      onClick={handleBuy}
      disabled={adding}
      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-3"
    >
      {adding ? "Agregando..." : "Comprar Ahora"}
    </button>
  );
}
