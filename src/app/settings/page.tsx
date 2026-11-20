"use client";

import { useI18n, Lang } from "@/lib/i18n";
import PageShell from "@/components/PageShell";
import { IconGlobe, IconTelegram, IconCheck } from "@/components/Icons";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();

  const handleResetQuests = () => {
    if (confirm("Are you sure you want to reset your local quest points and streaks?")) {
      localStorage.removeItem("chasing-ipho-quests");
      alert("Quest progress reset successfully!");
    }
  };

  const languages = [
    { code: "en" as Lang, label: "English", tag: "EN", desc: "English interface" },
    { code: "hy" as Lang, label: "Հայերեն", tag: "HY", desc: "Հայերեն ինտերֆեյս" },
    { code: "ru" as Lang, label: "Русский", tag: "RU", desc: "Русский интерфейс" },
  ];

  return (
    <PageShell title={t("settingsTitle")} subtitle={t("settingsDesc")}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Language Selection Card */}
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <IconGlobe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Interface Language / Լեզու / Язык
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map(({ code, label, tag, desc }) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                    active
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs"
                      : "border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.16] bg-white/50 dark:bg-neutral-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {tag}
                    </span>
                    {active && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">{label}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data & Storage Card */}
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Local Quest Data
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Your points, streaks, and completed questions are saved locally in your browser storage. You can reset them at any time.
          </p>
          <button
            onClick={handleResetQuests}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors active:scale-95"
          >
            Reset Quest Progress
          </button>
        </div>

        {/* About Card */}
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0c120f]/70 backdrop-blur-xl p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            About Chasing IPhO
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Chasing IPhO is an independent educational initiative dedicated to competitive physics, olympiad training, and high-level problem solving.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="https://t.me/chasing_IPho"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-semibold"
            >
              <IconTelegram className="w-3.5 h-3.5" />
              <span>Channel: @chasing_IPho</span>
              <span>↗</span>
            </a>
            <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
            <a
              href="https://t.me/chasing_IPho_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-semibold"
            >
              <IconTelegram className="w-3.5 h-3.5" />
              <span>Bot: @chasing_IPho_bot</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
