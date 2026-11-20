"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function PageShell({ title, subtitle, children, action }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.45 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-neutral-950 dark:text-neutral-50 leading-[1.1]"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </motion.div>
  );
}
