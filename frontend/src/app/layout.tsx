import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { StockProvider } from "@/lib/StockContext";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Weight Plate Calculator",
  description: "Calculadora de anilhas para barra",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "wcalculator",
  },
  manifest: "/wcalculator/manifest.json",
  icons: {
    apple: "/wcalculator/icons/icon-192.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#032147",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
    >
      <body>
        <StockProvider>{children}</StockProvider>
      </body>
    </html>
  );
}
