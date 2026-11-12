import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockPilot - Gestion Commerciale & Stocks (Togo & Afrique)",
  description: "SaaS professionnel de gestion de stocks, ventes, achats et facturation pour le Togo et l'Afrique francophone en FCFA.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1717F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-brand-bg text-brand-dark flex flex-col">
        {children}
      </body>
    </html>
  );
}
