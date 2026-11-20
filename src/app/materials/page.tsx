"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { getMaterials, getDriveDownloadUrl, getDriveViewUrl, getMaterialTitle } from "@/lib/data";
import PageShell from "@/components/PageShell";
import {
  IconSearch,
  IconBook,
  IconDownload,
  IconEye,
  IconTelegram,
} from "@/components/Icons";

export default function MaterialsPage() {
  const { t, lang, translateTopic } = useI18n();
  const allMaterials = useMemo(() => getMaterials(), []);

  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  const topicsList = useMemo(() => {
    const set = new Set<string>();
    allMaterials.forEach((m) => {
      if (m.topic) set.add(m.topic.toLowerCase().trim());
    });
    return Array.from(set).sort();
  }, [allMaterials]);

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((m) => {
      if (selectedTopic !== "all" && m.topic?.toLowerCase().trim() !== selectedTopic) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const title = getMaterialTitle(m, lang).toLowerCase();
        const rawTitle = (m.title || "").toLowerCase();
        return title.includes(q) || rawTitle.includes(q);
      }
      return true;
    });
  }, [allMaterials, selectedTopic, search, lang]);

  return (
    <PageShell title={t("materialsTitle")} subtitle={t("featMaterials")}>
      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books and materials..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-black/[0.06] dark:border-white/[0.08] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 backdrop-blur-md transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedTopic("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTopic === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              All Topics ({allMaterials.length})
            </button>
            {topicsList.map((top) => {
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
                  {translateTopic(top)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-20 bg-white/70 dark:bg-neutral-900/70 rounded-3xl border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400 mb-3">
            <IconBook className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">{t("noMaterials")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((m) => {
            const title = getMaterialTitle(m, lang);
            return (
              <div
                key={m.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/40"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="p-2.5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 shadow-xs border border-black/[0.04] dark:border-white/[0.06] text-neutral-700 dark:text-neutral-300">
                      <IconBook className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <span className="text-[11px] px-3 py-1 rounded-full font-semibold border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 uppercase tracking-wide">
                      {translateTopic(m.topic)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2">
                  {m.file_id && (
                    <>
                      <a
                        href={getDriveDownloadUrl(m.file_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 text-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <IconDownload className="w-3.5 h-3.5" />
                        <span>{t("download")}</span>
                      </a>
                      <a
                        href={getDriveViewUrl(m.file_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 text-center rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors active:scale-95 flex items-center justify-center gap-1"
                      >
                        <IconEye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </>
                  )}
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors"
                      title="Telegram Post"
                    >
                      <IconTelegram className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
