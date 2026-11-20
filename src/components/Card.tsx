"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

interface CardProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Card({ href, onClick, children, className = "", delay = 0 }: CardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4, delay }}
      whileHover={{ scale: 1.012, y: -2 }}
      whileTap={{ scale: 0.975 }}
      className={`group relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/40 ${
        href || onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Light edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }
  return content;
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const norm = (status || "").toLowerCase().trim();
  const isActive = norm === "active";
  const isSolved = norm === "solved";

  const color = isActive
    ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30"
    : isSolved
    ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30"
    : "bg-neutral-500/10 text-neutral-600 dark:bg-neutral-500/20 dark:text-neutral-400 border-neutral-500/20 dark:border-neutral-500/30";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border tracking-wide uppercase transition-colors ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? "bg-emerald-500 animate-pulse" : isSolved ? "bg-blue-500" : "bg-neutral-400"
        }`}
      />
      <span>{status}</span>
    </span>
  );
}
