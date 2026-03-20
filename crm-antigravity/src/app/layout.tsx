import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nyas CRM",
  description: "A modern CRM application built with Next.js and Nyas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
      <body className="flex h-full min-h-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50/50 dark:bg-zinc-950/50 relative">
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/10 to-transparent -z-10 pointer-events-none" />
          <div className="mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
