import React from "react";
import { Clock, Pill, Droplet, Utensils, CheckCircle2, AlertCircle, Hourglass } from "lucide-react";
import { Reminder } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";

interface CareTimelineProps {
  reminders: Reminder[];
}

export const CareTimeline: React.FC<CareTimelineProps> = ({ reminders }) => {
  const { t } = useLanguage();

  // Sort chronologically by time string
  const sorted = [...reminders].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t("caretaker.timeline")}
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Chronological Daily Sequence
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {sorted.map((item) => {
          const isTaken = item.status === "taken" || item.status === "completed";
          const isMissed = item.status === "missed";
          const isUpcoming = item.status === "upcoming";

          let TypeIcon = Pill;
          let iconColor = "text-blue-600";
          let typeLabel = "Medicine";

          if (item.type === "water") {
            TypeIcon = Droplet;
            iconColor = "text-sky-600";
            typeLabel = "Water Hydration";
          } else if (item.type === "meal") {
            TypeIcon = Utensils;
            iconColor = "text-amber-600";
            typeLabel = "Meal";
          }

          return (
            <div key={item.id} className="relative flex items-start gap-4 text-xs sm:text-sm">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${
                  isTaken
                    ? "border-emerald-500 text-emerald-600"
                    : isMissed
                    ? "border-rose-500 text-rose-600"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                {isTaken ? (
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                ) : isMissed ? (
                  <AlertCircle className="w-3.5 h-3.5 fill-rose-500 text-white" />
                ) : (
                  <Hourglass className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.time}</span>
                    <TypeIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    {item.dosage && (
                      <span className="text-xs text-slate-500 font-medium">({item.dosage})</span>
                    )}
                  </div>
                  {item.notes && <p className="text-xs text-slate-500 pl-0.5">{item.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize ${
                      isTaken
                        ? item.type === "water"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-800"
                        : isMissed
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isTaken
                      ? item.type === "water"
                        ? "✓ " + t("water.status.reported")
                        : "✓ " + t("common.taken")
                      : isMissed
                      ? "✕ " + t("common.missed")
                      : t("common.upcoming")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
