"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getQuests, Quest } from "@/lib/data";
import PageShell from "@/components/PageShell";
import { IconTrophy, IconFlame, IconTarget, IconCheck } from "@/components/Icons";

interface QuestProgress {
  points: number;
  streak: number;
  lastDate: string;
  completed: string[]; // quest indices
  attempts: Record<string, number>; // quest index -> attempt count
}

export default function QuestsPage() {
  const { t, lang } = useI18n();
  const allQuests = useMemo(() => getQuests(), []);

  // User Quest Progress from localStorage
  const [progress, setProgress] = useState<QuestProgress>({
    points: 0,
    streak: 1,
    lastDate: "",
    completed: [],
    attempts: {},
  });

  const [activeQuestIndex, setActiveQuestIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chasing-ipho-quests");
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date().toISOString().split("T")[0];
        let streak = parsed.streak || 1;
        // Streak calculation
        if (parsed.lastDate && parsed.lastDate !== today) {
          const last = new Date(parsed.lastDate);
          const now = new Date(today);
          const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            streak += 1;
          } else if (diffDays > 1) {
            streak = 1;
          }
        }
        setProgress({
          points: parsed.points || 0,
          streak,
          lastDate: today,
          completed: parsed.completed || [],
          attempts: parsed.attempts || {},
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Save progress helper
  const saveProgress = (newProg: QuestProgress) => {
    setProgress(newProg);
    try {
      localStorage.setItem("chasing-ipho-quests", JSON.stringify(newProg));
    } catch {
      // ignore
    }
  };

  const currentQuest = allQuests[activeQuestIndex] || allQuests[0];

  // Language-specific text for current quest
  const questQuestion = useMemo(() => {
    if (!currentQuest) return "";
    if (lang === "en" && currentQuest.question_en) return currentQuest.question_en;
    if (lang === "ru" && currentQuest.question_ru) return currentQuest.question_ru;
    return currentQuest.question;
  }, [currentQuest, lang]);

  const questOptions = useMemo(() => {
    if (!currentQuest) return [];
    if (lang === "en" && currentQuest.options_en && currentQuest.options_en.length > 0) {
      return currentQuest.options_en;
    }
    if (lang === "ru" && currentQuest.options_ru && currentQuest.options_ru.length > 0) {
      return currentQuest.options_ru;
    }
    return currentQuest.options || [];
  }, [currentQuest, lang]);

  const qIdStr = activeQuestIndex.toString();
  const isAlreadyCompleted = progress.completed.includes(qIdStr);

  const handleSelectOption = (opt: string) => {
    if (isAlreadyCompleted) return;
    setSelectedOption(opt);
    setFeedback(null);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAlreadyCompleted) return;

    const currentAttempts = (progress.attempts[qIdStr] || 0) + 1;
    const isCorrect =
      selectedOption.trim().toLowerCase() === currentQuest.answer.trim().toLowerCase() ||
      selectedOption.trim().startsWith(currentQuest.answer.trim());

    if (isCorrect) {
      let earnedPoints = 10;
      if (currentQuest.is_bonus) {
        earnedPoints = 20;
      } else if (currentAttempts > 1) {
        earnedPoints = 5;
      }

      const updated: QuestProgress = {
        ...progress,
        points: progress.points + earnedPoints,
        completed: [...progress.completed, qIdStr],
        attempts: { ...progress.attempts, [qIdStr]: currentAttempts },
      };
      saveProgress(updated);
      setFeedback({
        isCorrect: true,
        message: `Correct! You earned +${earnedPoints} points!`,
      });
    } else {
      const updated: QuestProgress = {
        ...progress,
        attempts: { ...progress.attempts, [qIdStr]: currentAttempts },
      };
      saveProgress(updated);
      setFeedback({
        isCorrect: false,
        message: "Incorrect answer. Please try again.",
      });
    }
  };

  return (
    <PageShell title={t("questsTitle")} subtitle={t("featQuests")}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score & Streak Apple Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IconTrophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">Total Points</div>
              <motion.div
                key={progress.points}
                initial={{ scale: 1.2, color: "#10b981" }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-neutral-900 dark:text-white"
              >
                {progress.points}
              </motion.div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <IconFlame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">Daily Streak</div>
              <div className="text-2xl font-bold text-amber-500">
                {progress.streak} {progress.streak === 1 ? "day" : "days"}
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IconTarget className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">Solved</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {progress.completed.length} / {allQuests.length}
              </div>
            </div>
          </div>
        </div>

        {/* Question Selector Carousel / Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allQuests.map((q, idx) => {
            const isDone = progress.completed.includes(idx.toString());
            const isCurrent = idx === activeQuestIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveQuestIndex(idx);
                  setSelectedOption("");
                  setFeedback(null);
                }}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isDone
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-white/80 dark:bg-neutral-900/80 border border-black/[0.05] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300"
                }`}
              >
                <span>Question #{idx + 1}</span>
                {q.is_bonus && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Bonus
                  </span>
                )}
                {isDone && <IconCheck className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Main Quest Interactive Card */}
        <motion.div
          key={activeQuestIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 sm:p-8 shadow-xs space-y-6"
        >
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                Quest #{activeQuestIndex + 1}
              </span>
              {currentQuest.is_bonus && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  Sunday Bonus (+20 pts)
                </span>
              )}
            </div>

            {isAlreadyCompleted && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <IconCheck className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed">
            {questQuestion}
          </div>

          {/* Options */}
          {questOptions.length > 0 ? (
            <div className="space-y-2.5 pt-2">
              {questOptions.map((opt, oIdx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isAlreadyCompleted}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/50 text-neutral-800 dark:text-neutral-200"
                    } ${isAlreadyCompleted ? "opacity-75 cursor-default" : "cursor-pointer active:scale-[0.99]"}`}
                  >
                    <span>{opt}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      {isSelected ? "●" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Free-text numerical input if no multiple-choice options */
            <div className="pt-2">
              <input
                type="text"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                placeholder="Type your numeric or symbolic answer..."
                disabled={isAlreadyCompleted}
                className="w-full p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          )}

          {/* Feedback Banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-2xl text-sm font-semibold ${
                  feedback.isCorrect
                    ? "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Row */}
          {!isAlreadyCompleted && (
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                className={`px-6 py-2.5 rounded-2xl font-semibold text-sm transition-all shadow-sm ${
                  selectedOption
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                }`}
              >
                {t("questSubmit")}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}
