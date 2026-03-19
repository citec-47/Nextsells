import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ShopStateProvider from "./components/buyer/ShopStateProvider";
import { AuthStateMonitor } from "./components/auth/AuthStateMonitor";
import { getPlatformNameFromDatabase } from '@/lib/platformBrand';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const platformName = await getPlatformNameFromDatabase();
  return {
    title: {
      default: platformName,
      template: `%s | ${platformName}`,
    },
    description: `${platformName} marketplace`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ShopStateProvider>
          <AuthStateMonitor />
          {children}
        </ShopStateProvider>
      </body>
    </html>
  );
}
