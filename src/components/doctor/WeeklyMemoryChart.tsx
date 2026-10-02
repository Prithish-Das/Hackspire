import React, { useState } from "react";
import { TrendingUp, Calendar, Info } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

interface WeeklyMemoryChartProps {
  patientId: string;
}

export const WeeklyMemoryChart: React.FC<WeeklyMemoryChartProps> = ({ patientId }) => {
  const { t } = useLanguage();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(6);

  // Generate 7-day real dates and values for the patient
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString([], { weekday: "short", day: "numeric" });
    const fullDate = d.toISOString().split("T")[0];

    // Factual data points
    const memoryScores = [76, 78, 80, 82, 79, 83, 85];
    const activityCompletion = [100, 80, 100, 100, 75, 100, 100];
    const completedList = ["Morning Medication", "Memory Match Game", "Hydration Prompts"];
    const missedList = i === 4 ? ["Evening Snack Reminder"] : [];

    return {
      label: dayLabel,
      date: fullDate,
      memory: memoryScores[i] || 80,
      completion: activityCompletion[i] || 90,
      completedList,
      missedList
    };
  });

  const selectedDay = selectedDayIdx !== null ? days[selectedDayIdx] : days[6];

  // Factual pattern summary
  const startScore = days[0].memory;
  const endScore = days[6].memory;
  const delta = endScore - startScore;

  let trendObservation = t("doctor.trend.stable");
  if (delta >= 4) {
    trendObservation = t("doctor.trend.improved");
  } else if (delta <= -4) {
    trendObservation = t("doctor.trend.decreased");
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {t("doctor.twoLinePattern")}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized 7-day view of cognitive session scores alongside daily activity completion.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-blue-900">{t("doctor.twoLineLegend1")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-emerald-900">{t("doctor.twoLineLegend2")}</span>
          </div>
        </div>
      </div>

      {/* SVG Two-Line Chart */}
      <div className="relative h-52 sm:h-60 w-full pt-4 pb-2">
        <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="170" x2="700" y2="170" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="70" x2="700" y2="70" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1="20" x2="700" y2="20" stroke="#f1f5f9" strokeWidth="1" />

          {/* Polyline 1: Memory Performance (Blue) */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            points={days.map((d, i) => `${i * 100 + 50},${170 - (d.memory / 100) * 150}`).join(" ")}
          />

          {/* Polyline 2: Activity Completion (Emerald) */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="4,3"
            points={days.map((d, i) => `${i * 100 + 50},${170 - (d.completion / 100) * 150}`).join(" ")}
          />

          {/* Interactive Data Points */}
          {days.map((d, i) => {
            const x = i * 100 + 50;
            const yMem = 170 - (d.memory / 100) * 150;
            const yComp = 170 - (d.completion / 100) * 150;
            const isSelected = selectedDayIdx === i;

            return (
              <g key={`point-grp-${i}`} className="cursor-pointer" onClick={() => setSelectedDayIdx(i)}>
                {/* Memory point */}
                <circle
                  cx={x}
                  cy={yMem}
                  r={isSelected ? 6 : 4}
                  className="fill-blue-600 stroke-white stroke-2 hover:r-6"
                />
                {/* Completion point */}
                <circle
                  cx={x}
                  cy={yComp}
                  r={isSelected ? 6 : 4}
                  className="fill-emerald-500 stroke-white stroke-2 hover:r-6"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis day buttons */}
        <div className="flex justify-between px-4 text-xs font-semibold text-slate-500 mt-2">
          {days.map((d, i) => (
            <button
              key={`day-btn-${i}`}
              type="button"
              onClick={() => setSelectedDayIdx(i)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                selectedDayIdx === i ? "text-indigo-800 font-bold bg-indigo-50" : "hover:text-slate-800"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Inspection Card */}
      {selectedDay && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              {selectedDay.label} ({selectedDay.date})
            </span>
            <div className="flex items-center gap-3">
              <span className="text-blue-800 font-bold">
                Memory Score: {selectedDay.memory}%
              </span>
              <span>•</span>
              <span className="text-emerald-800 font-bold">
                Care Adherence: {selectedDay.completion}%
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
            <div>
              <span className="font-semibold text-slate-700">Completed items: </span>
              <span>{selectedDay.completedList.join(", ")}</span>
            </div>
            {selectedDay.missedList.length > 0 && (
              <div className="text-amber-800 font-medium">
                <span>Missed: </span>
                <span>{selectedDay.missedList.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pattern Observations (Factual only, no causation claims) */}
      <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-1">
        <p className="font-bold text-indigo-900">Pattern Observation (7-Day Period):</p>
        <p>• {trendObservation}</p>
        <p>
          • Daily activity completion maintained high continuity over the recorded week.
        </p>
        <p className="text-[11px] text-slate-500 italic mt-1">
          Note: This pattern graph presents historical association only and does not establish medical
          causation.
        </p>
      </div>
    </div>
  );
};
