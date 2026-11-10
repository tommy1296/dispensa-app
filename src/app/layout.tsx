import type { Metadata, Viewport } from "next";
import { Literata, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Dispensa",
  description: "Il ricettario di casa",
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${manrope.variable} ${literata.variable}`}>
      <body className="min-h-screen antialiased">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
