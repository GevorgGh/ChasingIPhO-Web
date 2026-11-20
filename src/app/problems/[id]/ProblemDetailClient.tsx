"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Problem, getDriveDownloadUrl, getDriveViewUrl, getProblemTitle, formatProblemNumber } from "@/lib/data";
import PageShell from "@/components/PageShell";
import { StatusBadge } from "@/components/Card";
import {
  IconFileText,
  IconLightbulb,
  IconTag,
  IconTelegram,
  IconCheck,
  IconDownload,
  IconEye,
  IconArrowRight,
} from "@/components/Icons";

export default function ProblemDetailClient({
  id,
  matchedKey,
  problem,
}: {
  id: string;
  matchedKey: string;
  problem: Problem | null;
}) {
  const { t, lang, translateTopic } = useI18n();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!problem) {
    return (
      <PageShell title="Problem Not Found">
        <div className="text-center py-16 bg-white/70 dark:bg-neutral-900/70 rounded-3xl border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-xl">
          <p className="text-neutral-500">Problem #{id} was not found in the archive.</p>
          <Link
            href="/problems"
            className="inline-block mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            ← Back to Problems
          </Link>
        </div>
      </PageShell>
    );
  }

  const { display: displayNum } = formatProblemNumber(matchedKey);
  const title = getProblemTitle(problem, lang) || problem.title || `Problem #${displayNum}`;
  const probFileId = problem.problem_file_id || problem.file_id;
  const solFileId = problem.solution_file_id || problem.sol_file_id;
  const probLink = problem.link;
  const solLink = problem.solution_link;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitted(false);
      setSubmissionText("");
    }, 2000);
  };

  return (
    <PageShell title={`Problem #${displayNum}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/problems"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <span>← Back to all problems</span>
        </Link>

        {/* Problem Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-black/[0.04] dark:border-white/[0.06]">
                #{displayNum} <span className="text-xs font-normal opacity-50">({matchedKey})</span>
              </span>
              <StatusBadge status={problem.status} />
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
              <IconTag className="w-3.5 h-3.5" />
              <span>{translateTopic(problem.topic)}</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">
            {title}
          </h2>

          {/* Download & View Actions */}
          <div className="space-y-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.08]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Files & Attachments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {probFileId ? (
                <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-neutral-950/50 flex flex-col justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                    <IconFileText className="w-4 h-4 text-neutral-500" />
                    <span>Problem Statement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={getDriveDownloadUrl(probFileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 text-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1"
                    >
                      <IconDownload className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                    <a
                      href={getDriveViewUrl(probFileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 text-center rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors active:scale-95 flex items-center justify-center gap-1"
                    >
                      <IconEye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 flex items-center justify-center">
                  No problem PDF attached
                </div>
              )}

              {solFileId ? (
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    <IconLightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Official Solution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={getDriveDownloadUrl(solFileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 text-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1"
                    >
                      <IconDownload className="w-3.5 h-3.5" />
                      <span>Download Solution</span>
                    </a>
                    <a
                      href={getDriveViewUrl(solFileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 text-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-semibold transition-colors active:scale-95 flex items-center justify-center gap-1"
                    >
                      <IconEye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 flex items-center justify-center">
                  Solution in progress or not published yet
                </div>
              )}
            </div>

            {/* Telegram Channel Posts */}
            {(probLink || solLink) && (
              <div className="pt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400 mr-2">Community discussion:</span>
                {probLink && (
                  <a
                    href={probLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <IconTelegram className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{t("problemPost")}</span>
                    <span>↗</span>
                  </a>
                )}
                {solLink && (
                  <a
                    href={solLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <IconTelegram className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{t("solutionPost")}</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            )}

            {/* Submit Solution Button */}
            <div className="mt-6 pt-6 border-t border-black/[0.05] dark:border-white/[0.08]">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 font-semibold text-xs tracking-tight transition-all shadow-xs active:scale-98 flex items-center justify-center gap-2"
              >
                <span>{t("submitSolution")}</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Submit Solution Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0c120f] rounded-3xl border border-black/[0.08] dark:border-white/[0.1] p-6 shadow-2xl z-10"
            >
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                Submit Solution for #{displayNum}
              </h3>
              <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                Describe your reasoning or provide numerical answers. You can also submit full PDFs or photos directly via the Telegram Bot.
              </p>

              {submitted ? (
                <div className="p-6 text-center text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20 flex items-center justify-center gap-2">
                  <IconCheck className="w-5 h-5" />
                  <span>Solution submitted for review!</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    rows={5}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Describe your solution steps, numerical answers, or reasoning..."
                    className="w-full p-3.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-neutral-900 dark:text-white"
                    required
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <a
                      href={`https://t.me/chasing_IPho_bot?start=submitsol_${displayNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-semibold"
                    >
                      <IconTelegram className="w-3.5 h-3.5" />
                      <span>Send via Telegram Bot</span>
                      <span>↗</span>
                    </a>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(false)}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
                      >
                        Send Solution
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
