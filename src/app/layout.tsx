import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santiago te Premia",
  description: "Plataforma de beneficios turísticos - Cámara de Comercio de Santiago del Estero",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
