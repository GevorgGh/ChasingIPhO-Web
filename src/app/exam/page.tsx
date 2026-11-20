"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getProblems, getDriveDownloadUrl, getProblemTitle, Problem } from "@/lib/data";
import PageShell from "@/components/PageShell";
import { IconSparkles, IconFileText, IconLightbulb } from "@/components/Icons";

export default function ExamGeneratorPage() {
  const { t, lang, translateTopic } = useI18n();
  const allProblems = useMemo(() => getProblems(), []);

  // Topics available in problem bank
  const topicsList = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(allProblems).forEach((p) => {
      const top = p.topic?.toLowerCase().trim() || "general";
      counts[top] = (counts[top] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allProblems]);

  // Form State
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["kinematics", "dynamics"]);
  const [countPerTopic, setCountPerTopic] = useState<number>(2);
  const [examTitle, setExamTitle] = useState<string>("Physics Olympiad Mock Examination");
  const [generatedExam, setGeneratedExam] = useState<{ id: string; problem: Problem }[] | null>(null);

  const toggleTopic = (top: string) => {
    if (selectedTopics.includes(top)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== top));
    } else {
      setSelectedTopics([...selectedTopics, top]);
    }
  };

  const handleGenerate = () => {
    if (selectedTopics.length === 0) return;

    const result: { id: string; problem: Problem }[] = [];
    const problemsByTopic: Record<string, [string, Problem][]> = {};

    Object.entries(allProblems).forEach(([id, p]) => {
      const top = p.topic?.toLowerCase().trim() || "general";
      if (!problemsByTopic[top]) problemsByTopic[top] = [];
      problemsByTopic[top].push([id, p]);
    });

    selectedTopics.forEach((top) => {
      const available = problemsByTopic[top] || [];
      const picked = [...available].sort(() => 0.5 - Math.random()).slice(0, countPerTopic);
      picked.forEach(([id, prob]) => {
        result.push({ id, problem: prob });
      });
    });

    setGeneratedExam(result);
  };

  return (
    <PageShell title={t("examTitle")} subtitle={t("featExam")}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Configuration Card */}
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-2xl p-6 sm:p-8 shadow-xs space-y-6 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Exam Title
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-black/30 text-base font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          {/* Topics selection grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("selectTopics")} ({selectedTopics.length} selected)
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedTopics(
                    selectedTopics.length === topicsList.length ? [] : topicsList.map(([t]) => t)
                  )
                }
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors font-medium active:scale-95"
              >
                {selectedTopics.length === topicsList.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {topicsList.map(([top, count]) => {
                const isSelected = selectedTopics.includes(top);
                return (
                  <button
                    key={top}
                    type="button"
                    onClick={() => toggleTopic(top)}
                    className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between active:scale-[0.97] ${
                      isSelected
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
                        : "border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-neutral-700 dark:text-neutral-300 hover:border-black/[0.1] dark:hover:border-white/[0.12]"
                    }`}
                  >
                    <span className="truncate pr-2">{translateTopic(top)}</span>
                    <span className="text-[10px] font-mono opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions per topic */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              {t("questionsPerTopic")}: <span className="text-neutral-900 dark:text-white font-bold">{countPerTopic}</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCountPerTopic(num)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    countPerTopic === num
                      ? "bg-emerald-500 text-black shadow-xs font-extrabold"
                      : "bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={selectedTopics.length === 0}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                selectedTopics.length > 0
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                  : "bg-neutral-200 dark:bg-white/[0.05] text-neutral-400 cursor-not-allowed"
              }`}
            >
              <IconSparkles className="w-4 h-4" />
              <span>{t("generateExam")} ({selectedTopics.length * countPerTopic} Problems)</span>
            </button>
          </div>
        </div>

        {/* Generated Exam Preview */}
        {generatedExam && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-2xl p-6 sm:p-8 shadow-xs space-y-6 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
          >
            <div className="border-b border-black/[0.05] dark:border-white/[0.08] pb-4 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">
                Generated Exam Paper
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-1 tracking-tight">
                {examTitle}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Total Problems: {generatedExam.length} • Selected Topics: {selectedTopics.length}
              </p>
            </div>

            <div className="space-y-4">
              {generatedExam.map((item, idx) => {
                const prob = item.problem;
                const title = getProblemTitle(prob, lang) || prob.title || `Problem #${item.id}`;
                const fileId = prob.problem_file_id || prob.file_id;
                const solId = prob.solution_file_id || prob.sol_file_id;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Problem {idx + 1}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">#{item.id}</span>
                        <span className="text-xs text-neutral-500">
                          • {translateTopic(prob.topic)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {fileId && (
                        <a
                          href={getDriveDownloadUrl(fileId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all active:scale-95 shadow-xs"
                        >
                          <IconFileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      )}
                      {solId && (
                        <a
                          href={getDriveDownloadUrl(solId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.1] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-all active:scale-95"
                        >
                          <IconLightbulb className="w-3.5 h-3.5" />
                          <span>Solution</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
