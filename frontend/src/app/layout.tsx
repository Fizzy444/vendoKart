import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthModal } from "@/components/auth/AuthModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "vendoKart — AI Virtual Business Manager for Artisans",
  description:
    "AI-powered digital commerce enablement platform that helps traditional artisans and small producers become digitally market-ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen selection:bg-artisan-500 selection:text-white antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
