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
  title: "TOPCELL TELECOMUNICACIONES",
  description: "Tienda de teléfonos nuevos y seminuevos",
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
