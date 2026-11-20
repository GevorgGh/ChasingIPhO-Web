import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "Chasing IPhO — Physics Archive & Olympiad Hub",
  description: "Official resource repository for Chasing IPhO: Daily Quests, Channel Problems, Books & Materials, and Olympiad Archives.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-blue-500/20 selection:text-blue-600">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
