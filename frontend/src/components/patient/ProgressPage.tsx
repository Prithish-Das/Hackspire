import React, { useState } from "react";
import { TrendingUp, Award, Calendar, Info, BarChart3, Filter, CheckCircle2 } from "lucide-react";
import { Patient, DifficultyLevel, Language } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getDomainStats, getGameSessions } from "../../utils/storage";
import { SpeakButton } from "../common/SpeakButton";
import { normalizeDifficulty, DIFFICULTY_TIERS, NormalizedDifficulty } from "../../data/difficultyConfig";

interface ProgressPageProps {
  patient: Patient;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ patient }) => {
  const { t, language } = useLanguage();
  const lang = (language || "en") as Language;
  const domainStats = getDomainStats(patient.id);
  const gameSessions = getGameSessions(patient.id);

  const [difficultyFilter, setDifficultyFilter] = useState<"all" | NormalizedDifficulty>("all");

  const baseline = patient.baselineScore || 75;
  const currentAverage =
    domainStats.length > 0
      ? Math.round(domainStats.reduce((s, d) => s + d.runningAvg, 0) / domainStats.length)
      : baseline;

  const diff = currentAverage - baseline;

  const title = t("nav.patient.progress");
  const disclaimer = t("app.disclaimer");

  // Calculate best scores per difficulty for each 3-level game
  const gamesTracked = [
    { id: "memory_match", name: "Memory Match", icon: "🪔" },
    { id: "pattern_rhythm", name: "Pattern Rhythm", icon: "🎵" },
    { id: "complete_the_pattern", name: "Complete the Pattern", icon: "🧩" }
  ];

  const getBestScore = (gameId: string, diffLevel: NormalizedDifficulty): number | null => {
    const matching = gameSessions.filter(
      (gs) => gs.gameId === gameId && normalizeDifficulty(gs.difficulty) === diffLevel
    );
    if (matching.length === 0) return null;
    return Math.max(...matching.map((gs) => gs.score));
  };

  // Filtered game sessions
  const filteredSessions = gameSessions.filter((gs) => {
    if (difficultyFilter === "all") return true;
    return normalizeDifficulty(gs.difficulty) === difficultyFilter;
  });

  const getDifficultyBadgeStyle = (d: DifficultyLevel) => {
    const norm = normalizeDifficulty(d);
    if (norm === "pro") return "bg-rose-50 text-rose-700 border-rose-200";
    if (norm === "moderate") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <SpeakButton text={`${title}. Personal baseline comparison and cognitive activity trends. ${disclaimer}`} id="prog-speak" size="sm" />
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Track your cognitive engagement over time against your own personal baseline.
          </p>
        </div>

        {/* Current vs Baseline Badge */}
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 px-4 py-3 rounded-2xl">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Personal Baseline
            </span>
            <span className="text-lg font-bold text-slate-700">{baseline}%</span>
          </div>
          <div className="w-px h-8 bg-blue-200" />
          <div>
            <span className="text-xs text-blue-700 font-semibold uppercase block">
              Current Engagement
            </span>
            <span className="text-lg font-bold text-blue-900">{currentAverage}%</span>
          </div>
          <div className="w-px h-8 bg-blue-200" />
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">Change</span>
            <span
              className={`text-sm font-bold ${
                diff >= 0 ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {diff >= 0 ? `+${diff}%` : `${diff}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 font-medium leading-relaxed">
          <p className="font-bold text-slate-800 mb-0.5">Important Health Notice</p>
          <p>{disclaimer}</p>
          <p className="mt-1">
            This dashboard displays only your personal longitudinal activity history. There is
            strictly no comparison, leaderboard, or ranking against other individuals.
          </p>
        </div>
      </div>

      {/* Best Scores by Difficulty Breakdown Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Personal Best by Difficulty Level</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Highest scores achieved across Beginner, Moderate, and Pro practice sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {gamesTracked.map((game) => {
            const bestBeg = getBestScore(game.id, "beginner");
            const bestMod = getBestScore(game.id, "moderate");
            const bestPro = getBestScore(game.id, "pro");

            return (
              <div
                key={game.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl select-none">{game.icon}</span>
                  <span className="font-bold text-sm text-slate-800">{game.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Beginner */}
                  <div className="p-2 rounded-lg bg-white border border-emerald-200/80 shadow-xs">
                    <span className="text-[11px] font-semibold text-emerald-700 block flex items-center justify-center gap-1">
                      <span>🟢</span>
                      <span>Beg</span>
                    </span>
                    <span className="text-base font-bold text-slate-800 block mt-1">
                      {bestBeg !== null ? `${bestBeg}%` : "—"}
                    </span>
                  </div>

                  {/* Moderate */}
                  <div className="p-2 rounded-lg bg-white border border-amber-200/80 shadow-xs">
                    <span className="text-[11px] font-semibold text-amber-700 block flex items-center justify-center gap-1">
                      <span>🟡</span>
                      <span>Mod</span>
                    </span>
                    <span className="text-base font-bold text-slate-800 block mt-1">
                      {bestMod !== null ? `${bestMod}%` : "—"}
                    </span>
                  </div>

                  {/* Pro */}
                  <div className="p-2 rounded-lg bg-white border border-rose-200/80 shadow-xs">
                    <span className="text-[11px] font-semibold text-rose-700 block flex items-center justify-center gap-1">
                      <span>🔴</span>
                      <span>Pro</span>
                    </span>
                    <span className="text-base font-bold text-slate-800 block mt-1">
                      {bestPro !== null ? `${bestPro}%` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {domainStats.map((stat) => {
          const delta = stat.runningAvg - stat.baseline;

          return (
            <div
              key={stat.domain}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {stat.domain}
                </span>

                <div className="flex items-baseline justify-between mt-3 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {stat.runningAvg}%
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {delta >= 0 ? `+${delta}% vs baseline` : `${delta}% vs baseline`}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-3">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, stat.runningAvg)}%` }}
                  />
                </div>

                {/* 7-Day History Mini Sparkline / Trend dots */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Recent Sessions (Last 7 recorded days)
                  </span>
                  <div className="flex items-center justify-between gap-1">
                    {stat.history.slice(-7).map((h, i) => (
                      <div key={`dot-${i}`} className="flex flex-col items-center gap-1">
                        <div
                          className="w-5 rounded bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer"
                          style={{ height: `${Math.max(12, (h.score / 100) * 40)}px` }}
                          title={`${h.date}: ${h.score}%`}
                        />
                        <span className="text-[9px] text-slate-400">
                          {new Date(h.date).getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity History Log */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Completed Activity History</span>
          </h2>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">🟢 Beginner</option>
              <option value="moderate">🟡 Moderate</option>
              <option value="pro">🔴 Pro</option>
            </select>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">
            No completed activities recorded for the selected filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">{t("common.date")}</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">{t("common.domain")}</th>
                  <th className="pb-3">{t("common.difficulty")}</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Mistakes</th>
                  <th className="pb-3">{t("common.time")}</th>
                  <th className="pb-3 text-right">{t("common.score")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.slice(0, 15).map((gs) => {
                  const norm = normalizeDifficulty(gs.difficulty);
                  const tier = DIFFICULTY_TIERS[norm];

                  return (
                    <tr key={gs.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-slate-600 font-medium">
                        {new Date(gs.date).toLocaleDateString([], {
                          month: "short",
                          day: "numeric"
                        })}
                      </td>
                      <td className="py-3 font-bold text-slate-900 capitalize">
                        {gs.gameId.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 text-slate-600">{gs.domain}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyBadgeStyle(
                            gs.difficulty
                          )}`}
                        >
                          <span aria-hidden="true">{tier.badgeIcon}</span>
                          <span>{tier.name[lang] || tier.name.en}</span>
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        {gs.accuracy !== undefined ? `${gs.accuracy}%` : "—"}
                      </td>
                      <td className="py-3 text-slate-600">
                        {gs.mistakes !== undefined ? gs.mistakes : "—"}
                      </td>
                      <td className="py-3 text-slate-500">{gs.timeTaken}s</td>
                      <td className="py-3 text-right font-bold text-blue-600">{gs.score}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
