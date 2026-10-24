import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import { ProfileProvider } from "@/context/ProfileContext";
import ProfileDrawer from "@/components/ProfileDrawer";
import AuthModal from "@/components/AuthModal";

import { SettingsProvider } from "@/context/SettingsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stylish Fox - Premium Heavyweight Essentials",
  description: "Luxury oversized and heavyweight cotton essentials engineered for minimalists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-black text-white antialiased selection:bg-[#fef08a] selection:text-black">
        <SettingsProvider>
          <ProfileProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <ProfileDrawer />
              <AuthModal />
            </CartProvider>
          </ProfileProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
