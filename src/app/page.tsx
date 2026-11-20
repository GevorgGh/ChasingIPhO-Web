"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import Card from "@/components/Card";
import {
  IconTarget,
  IconLightbulb,
  IconBook,
  IconFileText,
  IconTrophy,
  IconClipboard,
  IconGlobe,
  IconCheck,
  IconTelegram,
  IconArrowRight,
} from "@/components/Icons";

export default function Home() {
  const { t } = useI18n();

  const features = [
    {
      href: "/quests",
      Icon: IconTarget,
      title: t("btnQuests"),
      desc: t("featQuests"),
      tag: "Interactive Practice",
      accent: "from-amber-500/15 via-orange-500/5 to-transparent",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    },
    {
      href: "/problems",
      Icon: IconLightbulb,
      title: t("btnProblems"),
      desc: t("featProblems"),
      tag: "78 Curated Problems",
      accent: "from-emerald-500/15 via-teal-500/5 to-transparent",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    },
    {
      href: "/materials",
      Icon: IconBook,
      title: t("btnMaterials"),
      desc: t("featMaterials"),
      tag: "24 Core Textbooks",
      accent: "from-cyan-500/15 via-blue-500/5 to-transparent",
      badgeColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    },
    {
      href: "/self-materials",
      Icon: IconFileText,
      title: t("btnSelfMaterials"),
      desc: t("featSelfMade"),
      tag: "Original Summaries",
      accent: "from-purple-500/15 via-pink-500/5 to-transparent",
      badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    },
    {
      href: "/olympiads",
      Icon: IconTrophy,
      title: t("btnOlympiads"),
      desc: t("featOlympiads"),
      tag: "IPhO & Armenian Archive",
      accent: "from-rose-500/15 via-red-500/5 to-transparent",
      badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    },
    {
      href: "/exam",
      Icon: IconClipboard,
      title: t("btnExam"),
      desc: t("featExam"),
      tag: "Dynamic Test Maker",
      accent: "from-indigo-500/15 via-violet-500/5 to-transparent",
      badgeColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    },
  ];

  const quickStats = [
    { label: "Problems", value: "78", Icon: IconLightbulb },
    { label: "Active", value: "4", Icon: IconCheck },
    { label: "Books", value: "24", Icon: IconBook },
    { label: "Olympiads", value: "379+", Icon: IconTrophy },
    { label: "Languages", value: "3", Icon: IconGlobe },
  ];

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-14">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
        {/* Floating Official Emblem with Apple Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="relative inline-block mb-6 group cursor-pointer"
        >
          {/* Subtle pulsating glow ring */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/40 via-teal-400/30 to-emerald-600/40 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden p-1 bg-gradient-to-b from-white/80 via-white/20 to-transparent dark:from-white/20 dark:via-white/5 dark:to-transparent shadow-2xl backdrop-blur-xl">
            <Image
              src="/logo.png"
              alt="Chasing IPhO Official Emblem"
              width={128}
              height={128}
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
        </motion.div>

        {/* Motto Pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.1 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 backdrop-blur-md">
            <span>SOLVE &bull; DISCUSS &bull; SUCCEED</span>
          </span>
        </motion.div>

        {/* Display Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.035em] text-neutral-950 dark:text-white leading-[1.05]"
        >
          Chasing IPhO
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.2 }}
          className="mt-4 text-base sm:text-xl text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed max-w-2xl mx-auto"
        >
          {t("welcomeDesc")}
        </motion.p>

        {/* Apple-style Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/problems"
            className="px-6 py-3 rounded-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all flex items-center gap-2"
          >
            <span>Explore Problems</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://t.me/chasing_IPho"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-full text-sm font-semibold bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border border-black/[0.08] dark:border-white/[0.1] active:scale-[0.97] transition-all flex items-center gap-2 shadow-xs"
          >
            <IconTelegram className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>@chasing_IPho</span>
          </a>
          <Link
            href="/quests"
            className="px-5 py-3 rounded-full text-sm font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 active:scale-[0.97] transition-all flex items-center gap-2"
          >
            <IconTarget className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Daily Quests</span>
          </Link>
        </motion.div>

        {/* Quick Stats Pill Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.3 }}
          className="mt-12 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 sm:p-2.5 rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-xl shadow-xs"
        >
          {quickStats.map((stat, i) => {
            const Icon = stat.Icon;
            return (
              <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/60">
                <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-neutral-900 dark:text-white">{stat.value}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</span>
                {i < quickStats.length - 1 && (
                  <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700 ml-1">&bull;</span>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Feature Cards Grid (Apple Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feat, idx) => {
          const Icon = feat.Icon;
          return (
            <Card key={feat.href} href={feat.href} delay={idx * 0.05} className="flex flex-col justify-between">
              {/* Ambient gradient wash */}
              <div
                className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-br ${feat.accent} rounded-full blur-2xl pointer-events-none -z-0`}
              />

              <div className="relative z-10">
                {/* Card Header with Icon + Tag Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="p-2.5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 shadow-xs border border-black/[0.04] dark:border-white/[0.06] text-neutral-800 dark:text-neutral-200">
                    <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <span
                    className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full border ${feat.badgeColor}`}
                  >
                    {feat.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              {/* Bottom action link */}
              <div className="relative z-10 mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Open Section</span>
                <IconArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
