import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[#FAF7F0] text-[#1E2316] flex flex-col min-h-screen selection:bg-emerald-600 selection:text-white antialiased"
      >
        <AuthProvider>
          <main className="flex-1 flex flex-col">{children}</main>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
