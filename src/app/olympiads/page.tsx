"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getIphoData, getOlympAmPhysics } from "@/lib/data";
import PageShell from "@/components/PageShell";
import {
  IconGlobe,
  IconSearch,
  IconFileText,
  IconLightbulb,
  IconExternalLink,
} from "@/components/Icons";

export default function OlympiadsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"ipho" | "armenian">("ipho");

  const ipho = useMemo(() => getIphoData(), []);
  const armenianNodes = useMemo(() => getOlympAmPhysics(), []);

  const [selectedIphoTopic, setSelectedIphoTopic] = useState<string>("mechanics");
  const [armSearch, setArmSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const armYears = useMemo(() => {
    const set = new Set<string>();
    armenianNodes.forEach((n) => {
      if (n.year) set.add(n.year);
    });
    return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a));
  }, [armenianNodes]);

  const filteredArmenian = useMemo(() => {
    return armenianNodes.filter((node) => {
      if (selectedYear !== "all" && node.year !== selectedYear) return false;
      if (armSearch.trim()) {
        const q = armSearch.trim().toLowerCase();
        return (
          node.title?.toLowerCase().includes(q) ||
          node.header?.toLowerCase().includes(q) ||
          node.stage?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [armenianNodes, selectedYear, armSearch]);

  const currentIphoProblems = useMemo(() => {
    const probs = ipho.problems || [];
    return probs.filter((p) => p.topics?.includes(selectedIphoTopic));
  }, [ipho, selectedIphoTopic]);

  return (
    <PageShell title={t("olympiadsTitle")} subtitle={t("featOlympiads")}>
      {/* Segmented Control — Apple style with sliding physical pill */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-xl">
          {[
            { id: "ipho" as const, label: t("ipho"), Icon: IconGlobe },
            { id: "armenian" as const, label: t("armenian"), Icon: IconFileText },
          ].map((item) => {
            const active = tab === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`relative px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-tight transition-colors z-10 flex items-center gap-2 ${
                  active
                    ? "text-neutral-950 dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="olympiad-tab-pill"
                    className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: IPhO Archive */}
      {tab === "ipho" && (
        <motion.div
          key="ipho"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="space-y-6"
        >
          {/* IPhO Topic Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {Object.entries(ipho.topics || {}).map(([key, name]) => {
              const count = (ipho.problems || []).filter((p) => p.topics?.includes(key)).length;
              const isSelected = selectedIphoTopic === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedIphoTopic(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>

          {/* IPhO Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentIphoProblems.map((prob) => (
              <div
                key={prob.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/40"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      IPhO {prob.year} P{prob.number}
                    </span>
                    {prob.subtopics && prob.subtopics.length > 0 && (
                      <span className="text-xs text-neutral-400 capitalize">
                        {prob.subtopics[0].replace(/-/g, " ")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {prob.title || `Problem ${prob.number}`}
                  </h3>
                  {prob.country && (
                    <p className="text-xs text-neutral-400 mb-3">Host: {prob.country}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2">
                  {prob.problem_url && (
                    <a
                      href={prob.problem_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold text-center transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:opacity-90 shadow-xs"
                    >
                      <IconFileText className="w-3.5 h-3.5" />
                      <span>Problem</span>
                    </a>
                  )}
                  {prob.solution_url && (
                    <a
                      href={prob.solution_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/20 active:scale-95"
                    >
                      <IconLightbulb className="w-3.5 h-3.5" />
                      <span>Solution</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 2: Armenian Olympiads */}
      {tab === "armenian" && (
        <motion.div
          key="armenian"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="space-y-6"
        >
          {/* Search & Year Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={armSearch}
                onChange={(e) => setArmSearch(e.target.value)}
                placeholder="Search Armenian olympiads, stages..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-black/[0.06] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 backdrop-blur-md transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedYear("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedYear === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                All Years ({armenianNodes.length})
              </button>
              {armYears.slice(0, 10).map((yr) => {
                const isSelected = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Armenian Nodes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredArmenian.map((node) => (
              <div
                key={node.node_id}
                className="group relative flex flex-col justify-between rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/40"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {node.year}
                    </span>
                    {node.stage && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.06]">
                        {node.stage}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {node.title}
                  </h3>
                  {node.header && (
                    <p className="text-xs text-neutral-400 mb-3">{node.header}</p>
                  )}
                </div>

                {/* Attachments */}
                {node.attachments && node.attachments.length > 0 && (
                  <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                      Attachments ({node.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {node.attachments.map((att, attIdx) => (
                        <a
                          key={attIdx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-all active:scale-95"
                        >
                          <IconFileText className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="truncate max-w-[200px]">{att.title}</span>
                          <IconExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}
