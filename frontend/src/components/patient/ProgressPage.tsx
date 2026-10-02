import React from "react";
import { TrendingUp, Award, Calendar, Info, BarChart3 } from "lucide-react";
import { Patient } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getDomainStats, getGameSessions } from "../../utils/storage";
import { SpeakButton } from "../common/SpeakButton";

interface ProgressPageProps {
  patient: Patient;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ patient }) => {
  const { t } = useLanguage();
  const domainStats = getDomainStats(patient.id);
  const gameSessions = getGameSessions(patient.id);

  const baseline = patient.baselineScore || 75;
  const currentAverage =
    domainStats.length > 0
      ? Math.round(domainStats.reduce((s, d) => s + d.runningAvg, 0) / domainStats.length)
      : baseline;

  const diff = currentAverage - baseline;

  const title = t("nav.patient.progress");
  const disclaimer = t("app.disclaimer");

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
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Completed Activity History</span>
        </h2>

        {gameSessions.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No completed activities recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">{t("common.date")}</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">{t("common.domain")}</th>
                  <th className="pb-3">{t("common.difficulty")}</th>
                  <th className="pb-3">{t("common.time")}</th>
                  <th className="pb-3 text-right">{t("common.score")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gameSessions.slice(0, 10).map((gs) => (
                  <tr key={gs.id} className="hover:bg-slate-50">
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
                      <span className="capitalize px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {gs.difficulty}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{gs.timeTaken}s</td>
                    <td className="py-3 text-right font-bold text-blue-600">{gs.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
