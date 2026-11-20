"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getProblems, getDriveDownloadUrl, getProblemTitle, formatProblemNumber, Problem } from "@/lib/data";
import PageShell from "@/components/PageShell";
import { StatusBadge } from "@/components/Card";
import {
  IconCloud,
  IconRefresh,
  IconSearch,
  IconClose,
  IconFileText,
  IconLightbulb,
  IconTag,
  IconArrowRight,
} from "@/components/Icons";

export default function ProblemsPage() {
  const { t, lang, translateTopic } = useI18n();
  const [allProblems, setAllProblems] = useState<Record<string, Problem>>(() => getProblems());

  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Sync client-side data if /api/problems has newer data
  useEffect(() => {
    fetch("/api/problems")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setAllProblems(data);
        }
      })
      .catch(() => {});
  }, []);

  // Compute status counts across all problems
  const statusCounts = useMemo(() => {
    const list = Object.values(allProblems);
    const total = list.length;
    let active = 0;
    let solved = 0;
    list.forEach((p) => {
      const s = (p.status || "").toLowerCase().trim();
      if (s === "active") active++;
      else if (s === "solved") solved++;
    });
    return { total, active, solved };
  }, [allProblems]);

  // Handle status tab changes with smart topic reset
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    if (selectedTopic !== "all") {
      const hasMatchingInTopic = Object.values(allProblems).some((p) => {
        const matchTopic = (p.topic || "").toLowerCase().trim() === selectedTopic;
        if (!matchTopic) return false;
        if (newStatus === "all") return true;
        return (p.status || "").toLowerCase().trim() === newStatus.toLowerCase().trim();
      });
      if (!hasMatchingInTopic) {
        setSelectedTopic("all");
      }
    }
  };

  // Dynamic topic counts matching the currently selected status
  const topicsList = useMemo(() => {
    const map = new Map<string, number>();
    Object.values(allProblems).forEach((p) => {
      const s = (p.status || "").toLowerCase().trim();
      if (selectedStatus !== "all" && s !== selectedStatus.toLowerCase().trim()) return;
      const top = p.topic ? p.topic.toLowerCase().trim() : "general";
      map.set(top, (map.get(top) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allProblems, selectedStatus]);

  // Total problems in the current status category
  const currentStatusTotal = useMemo(() => {
    if (selectedStatus === "active") return statusCounts.active;
    if (selectedStatus === "solved") return statusCounts.solved;
    return statusCounts.total;
  }, [selectedStatus, statusCounts]);

  // Filtered problems sorted numerically descending (78 down to 1)
  const filteredProblems = useMemo(() => {
    return Object.entries(allProblems)
      .filter(([id, p]) => {
        // Status filter
        if (selectedStatus !== "all") {
          const s = (p.status || "").toLowerCase().trim();
          if (s !== selectedStatus.toLowerCase().trim()) return false;
        }
        // Topic filter
        if (selectedTopic !== "all") {
          const top = (p.topic || "").toLowerCase().trim();
          if (top !== selectedTopic) return false;
        }
        // Search filter (number or title)
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const cleanNum = parseInt(id, 10).toString();
          const matchNum = id.toLowerCase().includes(q) || cleanNum === q || cleanNum.includes(q);
          const title = getProblemTitle(p, lang).toLowerCase();
          const rawTitle = (p.title || "").toLowerCase();
          return matchNum || title.includes(q) || rawTitle.includes(q);
        }
        return true;
      })
      .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10));
  }, [allProblems, selectedStatus, selectedTopic, search, lang]);

  const handleDriveSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Connecting to Google Drive...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Drive synced successfully. Found ${data.problemsCount} problems.`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncStatus(`Sync notice: ${data.error || "Completed"}`);
      }
    } catch {
      setSyncStatus("Sync request sent. Reloading page...");
      setTimeout(() => window.location.reload(), 2000);
    } finally {
      setIsSyncing(false);
    }
  };

  const statusTabs = [
    { id: "all", label: t("allProblems"), count: statusCounts.total },
    { id: "active", label: t("statusActive"), count: statusCounts.active, dot: "bg-emerald-500" },
    { id: "solved", label: t("statusSolved"), count: statusCounts.solved, dot: "bg-blue-500" },
  ];

  return (
    <PageShell
      title={t("problemsTitle")}
      subtitle={`${statusCounts.total} Curated Physics Problems \u2022 ${statusCounts.active} Active for Discussion`}
    >
      {/* Apple-style Translucent Action Bar for Google Drive Cloud Sync */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#0c120f]/70 border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/20">
            <IconCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Google Drive Cloud Sync
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Automated repository mirror &bull; {statusCounts.total} problems loaded
            </div>
          </div>
        </div>

        <button
          onClick={handleDriveSync}
          disabled={isSyncing}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 shadow-xs ${
            isSyncing
              ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95"
          }`}
        >
          <IconRefresh className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Refresh from Drive"}</span>
        </button>
      </div>

      {syncStatus && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-medium border border-emerald-200 dark:border-emerald-800 backdrop-blur-md"
        >
          {syncStatus}
        </motion.div>
      )}

      {/* Search and Segmented Filter Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Apple-style Search Input */}
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by problem # or title..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-black/[0.06] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 backdrop-blur-md transition-all shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Apple Segmented Control with Physical Sliding Pill */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-900/90 p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] self-start sm:self-auto">
            {statusTabs.map((tab) => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleStatusChange(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-colors z-10 flex items-center gap-1.5 ${
                    active
                      ? "text-neutral-950 dark:text-white"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="status-pill"
                      className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  {tab.dot && <span className={`relative z-10 w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      active
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Topic Filter Chips — Horizontal scroll with gentle spring feel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedTopic("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTopic === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            {t("allProblems")} ({currentStatusTotal})
          </button>
          {topicsList.map(([top, count]) => {
            const isSelected = selectedTopic === top;
            return (
              <button
                key={top}
                onClick={() => setSelectedTopic(top)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {translateTopic(top)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Cards Grid */}
      {filteredProblems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-white/70 dark:bg-neutral-900/60 rounded-3xl border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <IconSearch className="w-6 h-6" />
          </div>
          <p className="mt-4 text-base text-neutral-800 dark:text-neutral-200 font-semibold">
            {t("noProblems")}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {selectedStatus !== "all" || selectedTopic !== "all" || search
              ? "Try adjusting your search query or reset the filters below."
              : "No physics problems in this category."}
          </p>
          {(selectedStatus !== "all" || selectedTopic !== "all" || search) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedTopic("all");
                setSelectedStatus("all");
              }}
              className="mt-5 px-5 py-2.5 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              Reset all filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProblems.map(([id, p]) => {
              const { display: displayNum } = formatProblemNumber(id);
              const title = getProblemTitle(p, lang) || p.title || `Problem #${displayNum}`;
              const probFileId = p.problem_file_id || p.file_id;
              const solFileId = p.solution_file_id || p.sol_file_id;

              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  whileHover={{ scale: 1.012, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/40"
                >
                  {/* Light edge highlight on top */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />

                  <div>
                    {/* Top Row: Problem Number Badge and Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-black/[0.04] dark:border-white/[0.06]">
                        #{displayNum}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>

                    {/* Title */}
                    <Link
                      href={`/problems/${displayNum}`}
                      className="block text-base font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2"
                    >
                      {title}
                    </Link>

                    {/* Topic */}
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-1.5">
                      <IconTag className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium">{translateTopic(p.topic)}</span>
                    </div>
                  </div>

                  {/* Action Buttons: Problem & Solution PDFs */}
                  <div className="pt-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center gap-2">
                    {probFileId && (
                      <a
                        href={getDriveDownloadUrl(probFileId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors active:scale-95"
                      >
                        <IconFileText className="w-3.5 h-3.5" />
                        <span>{t("problemFile")}</span>
                      </a>
                    )}
                    {solFileId && (
                      <a
                        href={getDriveDownloadUrl(solFileId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 transition-colors active:scale-95 border border-emerald-500/20"
                      >
                        <IconLightbulb className="w-3.5 h-3.5" />
                        <span>{t("solutionFile")}</span>
                      </a>
                    )}
                    <Link
                      href={`/problems/${displayNum}`}
                      className="ml-auto text-xs font-semibold text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 flex items-center gap-1"
                    >
                      <span>Details</span>
                      <IconArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageShell>
  );
}
