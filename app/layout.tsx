import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eqp Dashboard",
  description: "Painel de gestão de grupos, campanhas e vendas.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Eqp Dashboard",
    description: "Acompanhe suas ofertas, grupos e vendas em tempo real.",
    url: "https://eqp.lat",
    siteName: "Eqp Dashboard",
    images: [
      {
        url: "/image.png", // 1200x630
        width: 1200,
        height: 630,
        alt: "Eqp Dashboard Preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image", // 🔹 mostra imagem grande
    title: "Eqp Dashboard",
    description: "Gerencie grupos, campanhas e vendas de forma inteligente.",
    images: ["/image.png"], // mesma imagem do OpenGraph
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
