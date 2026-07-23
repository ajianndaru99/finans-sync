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
  title: "Finans Sync",
  description: "Aplikasi pelacak keuangan otomatis",
  manifest: "/manifest.json",
  themeColor: "#059669",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finans Sync",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

import PWARegister from "./components/PWARegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
