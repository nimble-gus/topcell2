"use client";

const WHATSAPP_NUMBER = "50239665068";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-green-500/20 transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500"
      aria-label="Chatea con nosotros por WhatsApp"
      title="Chatea con nosotros por WhatsApp"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/whatsapp.svg"
        alt=""
        className="h-8 w-8"
        width={32}
        height={32}
      />
    </a>
  );
}
