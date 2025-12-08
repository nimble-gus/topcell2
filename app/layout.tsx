import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TopCell - Teléfonos Nuevos y Seminuevos en Guatemala",
    template: "%s | TopCell Telecomunicaciones",
  },
  description: "TopCell Telecomunicaciones - Tu tienda de confianza para teléfonos nuevos y seminuevos en Guatemala. Encuentra los mejores precios en smartphones de las principales marcas. Envío a domicilio y recogida en bodega disponible.",
  keywords: [
    "teléfonos nuevos",
    "teléfonos seminuevos",
    "smartphones Guatemala",
    "iPhone Guatemala",
    "Samsung Guatemala",
    "accesorios móviles",
    "TopCell",
    "telecomunicaciones Guatemala",
  ],
  authors: [{ name: "TopCell Telecomunicaciones" }],
  creator: "TopCell Telecomunicaciones",
  publisher: "TopCell Telecomunicaciones",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://topcell.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_GT",
    url: "/",
    siteName: "TopCell Telecomunicaciones",
    title: "TopCell - Teléfonos Nuevos y Seminuevos en Guatemala",
    description: "Tu tienda de confianza para teléfonos nuevos y seminuevos en Guatemala. Encuentra los mejores precios en smartphones de las principales marcas.",
    countryName: "Guatemala",
  },
  twitter: {
    card: "summary_large_image",
    title: "TopCell - Teléfonos Nuevos y Seminuevos en Guatemala",
    description: "Tu tienda de confianza para teléfonos nuevos y seminuevos en Guatemala.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} font-sans antialiased bg-white`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
