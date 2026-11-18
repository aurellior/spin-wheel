import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Roda Undian Interaktif - Spin Wheel",
  description: "Putar roda keberuntungan & tentukan pilihan secara interaktif",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-700">
        {children}
      </body>
    </html>
  );
}
