"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, Lang } from "@/lib/i18n";
import {
  IconHome,
  IconTarget,
  IconLightbulb,
  IconBook,
  IconFileText,
  IconTrophy,
  IconClipboard,
  IconSettings,
} from "@/components/Icons";

const NAV_ITEMS = [
  { href: "/", key: "navHome", Icon: IconHome },
  { href: "/quests", key: "navQuests", Icon: IconTarget },
  { href: "/problems", key: "navProblems", Icon: IconLightbulb },
  { href: "/materials", key: "navMaterials", Icon: IconBook },
  { href: "/self-materials", key: "navSelfMaterials", Icon: IconFileText },
  { href: "/olympiads", key: "navOlympiads", Icon: IconTrophy },
  { href: "/exam", key: "navExam", Icon: IconClipboard },
  { href: "/settings", key: "navSettings", Icon: IconSettings },
];

export default function Navbar() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Translucent floating navbar with light-catching edge */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/70 dark:bg-[#070b09]/75 border-b border-black/[0.05] dark:border-white/[0.08] transition-colors">
        {/* Subtle light edge on top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 dark:via-emerald-400/20 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Brand with official emblem */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1.5 ring-emerald-500/40 shadow-sm shadow-emerald-500/20 group-hover:scale-105 group-hover:ring-emerald-400 transition-all duration-300">
                <Image
                  src="/logo.png"
                  alt="Chasing IPhO Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Chasing IPhO
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-600/80 dark:text-emerald-400/80 -mt-1 hidden sm:inline">
                  Physics Archive
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with Apple Spring Sliding Pill */}
            <div className="hidden lg:flex items-center gap-1 bg-neutral-100/70 dark:bg-neutral-900/50 p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
              {NAV_ITEMS.map(({ href, key, Icon }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-colors z-10 ${
                      active
                        ? "text-emerald-950 dark:text-emerald-200"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white dark:bg-emerald-950/60 rounded-xl shadow-xs border border-black/[0.04] dark:border-emerald-500/30"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t(key)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Right controls: Language Switcher + Mobile Button */}
            <div className="flex items-center gap-2">
              {/* Segmented language pill control */}
              <div className="hidden sm:flex items-center bg-neutral-100 dark:bg-neutral-900/80 rounded-full p-1 border border-black/[0.04] dark:border-white/[0.06]">
                {(["en", "hy", "ru"] as Lang[]).map((l) => {
                  const isCurrent = lang === l;
                  return (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`relative px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        isCurrent
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      {isCurrent && (
                        <motion.div
                          layoutId="lang-pill"
                          className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                        />
                      )}
                      <span className="relative z-10">{l === "en" ? "EN" : l === "hy" ? "HY" : "RU"}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer with Apple Spring Animation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed inset-x-0 top-16 z-40 backdrop-blur-2xl bg-white/95 dark:bg-[#070b09]/95 border-b border-black/[0.06] dark:border-white/[0.08] lg:hidden shadow-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1.5">
              {NAV_ITEMS.map(({ href, key, Icon }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t(key)}</span>
                  </Link>
                );
              })}

              {/* Mobile language bar */}
              <div className="mt-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500">Language:</span>
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
                  {(["en", "hy", "ru"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        lang === l
                          ? "bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-neutral-500"
                      }`}
                    >
                      {l === "en" ? "EN" : l === "hy" ? "HY" : "RU"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
