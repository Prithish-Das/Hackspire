import React from "react";
import { TrendingUp, Award, Clock, AlertCircle } from "lucide-react";
import { Patient } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getDomainStats } from "../../utils/storage";

interface MemoryImprovementProps {
  patient: Patient;
}

export const MemoryImprovement: React.FC<MemoryImprovementProps> = ({ patient }) => {
  const { t } = useLanguage();
  const domainStats = getDomainStats(patient.id);

  const baseline = patient.baselineScore;
  const memoryDomain = domainStats.find((d) => d.domain === "Memory & Attention") || domainStats[0];

  const currentScore = memoryDomain?.runningAvg;

  if (!baseline || !currentScore) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
        <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
        <p className="font-semibold">{t("doctor.insufficientData")}</p>
      </div>
    );
  }

  const change = currentScore - baseline;
  let descriptor = t("doctor.trend.stable");
  let badgeColor = "bg-blue-100 text-blue-800";

  if (change >= 5) {
    descriptor = t("doctor.trend.improved");
    badgeColor = "bg-emerald-100 text-emerald-800";
  } else if (change <= -5) {
    descriptor = t("doctor.trend.decreased");
    badgeColor = "bg-amber-100 text-amber-800";
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t("doctor.memoryImprovement")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective baseline versus current moving engagement score.
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
          {descriptor}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block font-medium">Initial Baseline</span>
          <span className="text-xl font-black text-slate-700">{baseline}%</span>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <span className="text-xs text-blue-700 block font-semibold">Current Moving Average</span>
          <span className="text-xl font-black text-blue-900">{currentScore}%</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block font-medium">Recorded Change</span>
          <span
            className={`text-xl font-black ${
              change >= 0 ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {change >= 0 ? `+${change}%` : `${change}%`}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block font-medium">Observation Window</span>
          <span className="text-sm font-bold text-slate-800 block mt-1">30 Days Active</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
        <strong>Factual Pattern Summary: </strong>
        Baseline recorded at {baseline}%. Current performance across memory activities is{" "}
        {currentScore}%, indicating a calculated net variation of {change >= 0 ? `+${change}%` : `${change}%`}.
      </p>
    </div>
  );
};
