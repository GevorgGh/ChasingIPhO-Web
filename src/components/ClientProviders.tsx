"use client";

import { ReactNode, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>
      <Suspense fallback={<div className="min-h-screen" />}>
        <main className="flex-1 pt-20 pb-16">{children}</main>
      </Suspense>
      <footer className="border-t border-black/[0.05] dark:border-white/[0.08] py-10 bg-white/40 dark:bg-[#060908]/40 backdrop-blur-md text-sm text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-emerald-500/30">
              <Image src="/logo.png" alt="Chasing IPhO" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Chasing IPhO</p>
              <p className="text-[11px] text-neutral-400">Official Physics Archive &bull; Solve &bull; Discuss &bull; Succeed</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs font-semibold">
            <Link href="/problems" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Problems
            </Link>
            <Link href="/materials" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Materials
            </Link>
            <Link href="/olympiads" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Olympiads
            </Link>
            <a
              href="https://t.me/chasing_IPho"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Telegram Channel</span>
              <span>↗</span>
            </a>
            <a
              href="https://t.me/ChasingIPhOBot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Bot</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </footer>
    </I18nProvider>
  );
}
