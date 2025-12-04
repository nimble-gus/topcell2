"use client";

import { useEffect, useState } from "react";

interface Marca {
  id: number;
  nombre: string;
}

interface Color {
  id: number;
  color: string;
}

interface MarcasColoresLoaderProps {
  onMarcasLoaded: (marcas: Marca[]) => void;
  onColoresLoaded: (colores: Color[]) => void;
  selectedMarcaId?: string;
  selectedColores?: number[];
  onMarcaChange?: (marcaId: string) => void;
  onColoresChange?: (colores: number[]) => void;
}

export default function MarcasColoresLoader({
  onMarcasLoaded,
  onColoresLoaded,
  selectedMarcaId,
  selectedColores = [],
  onMarcaChange,
  onColoresChange,
}: MarcasColoresLoaderProps) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [marcasRes, coloresRes] = await Promise.all([
          fetch("/api/admin/marcas"),
          fetch("/api/admin/colores"),
        ]);

        const marcasData = await marcasRes.json();
        const coloresData = await coloresRes.json();

        setMarcas(marcasData);
        setColores(coloresData);
        onMarcasLoaded(marcasData);
        onColoresLoaded(coloresData);
      } catch (error) {
        console.error("Error al cargar marcas y colores:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [onMarcasLoaded, onColoresLoaded]);

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando...</div>;
  }

  // Este componente solo carga los datos, no renderiza nada
  // Los componentes hijos deben usar las props onMarcasLoaded y onColoresLoaded
  return null;
}

