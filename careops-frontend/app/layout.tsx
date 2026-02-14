import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "CareOps - Healthcare Operations Management",
    template: "%s | CareOps",
  },
  description: "Professional healthcare operations platform. Streamline bookings, communications, forms, and inventory management for medical practices.",
  keywords: ["healthcare", "medical practice", "operations management", "patient scheduling", "medical CRM", "healthcare SaaS"],
  authors: [{ name: "CareOps" }],
  creator: "CareOps Team",
  publisher: "CareOps",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://careops.com",
    title: "CareOps - Healthcare Operations Management",
    description: "Professional healthcare operations platform for medical practices.",
    siteName: "CareOps",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CareOps - Healthcare Operations Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareOps - Healthcare Operations Management",
    description: "Professional healthcare operations platform for medical practices.",
    images: ["/opengraph-image.png"],
    creator: "@careops",
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#1E3A8A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body 
        className={`
          ${inter.variable} 
          antialiased 
          min-h-screen 
          font-sans
          bg-background
          text-foreground
          selection:bg-primary-100
          selection:text-primary-900
        `}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
        
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="
            fixed top-4 left-4 
            bg-primary-600 text-white 
            px-4 py-2 rounded-lg 
            shadow-lg 
            transform -translate-y-20 
            transition-transform duration-300 
            focus:translate-y-0 
            focus:outline-none 
            focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            z-50
          "
        >
          Skip to main content
        </a>
      </body>
    </html>
  );
}
