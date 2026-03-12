"use client";

import { useState, useEffect } from "react";

export default function TableScrollHint() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wasDismissed = sessionStorage.getItem("seminuevo-scroll-hint-dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    } else {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("seminuevo-scroll-hint-dismissed", "true");
    }
  };

  if (!visible || dismissed) return null;

  return (
    <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-black/80 text-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <span className="text-sm font-medium">
            Desliza hacia la izquierda para ver más detalles
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
