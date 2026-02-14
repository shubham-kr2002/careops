import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareOps - Unified Operations Platform",
  description: "Eliminate tool chaos. One platform for leads, bookings, communications, forms, and inventory.",
  keywords: ["SaaS", "operations", "business management", "bookings", "CRM"],
  authors: [{ name: "CareOps" }],
  openGraph: {
    title: "CareOps - Unified Operations Platform",
    description: "Eliminate tool chaos. One platform for leads, bookings, communications, forms, and inventory.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen font-sans`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
