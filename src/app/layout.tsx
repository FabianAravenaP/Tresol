import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Tresol",
  description: "Tresol - Gestión y Valorización de Residuos",
  icons: {
    icon: "https://tresol.cl/es/wp-content/uploads/2025/05/Recurso-5Logo-oficial-de-tresol.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}