import React from "react";
import { Pill, Droplet, Utensils, Check, Clock } from "lucide-react";
import { Reminder } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { SpeakButton } from "../common/SpeakButton";

interface ReminderCardProps {
  reminder: Reminder;
  onMarkTaken: (id: string) => void;
  onWaterPrompt?: (reminder: Reminder) => void;
  onSnooze: (id: string) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onMarkTaken,
  onWaterPrompt,
  onSnooze
}) => {
  const { t } = useLanguage();

  const isMedicine = reminder.type === "medicine";
  const isWater = reminder.type === "water";
  const isMeal = reminder.type === "meal";

  // Configuration per type
  let badgeTitle = t("reminder.medicine.title");
  let subText = reminder.instructions || t("reminder.medicine.sub");
  let Icon = Pill;
  let cardBg = "bg-rose-50 border-rose-200";
  let iconBg = "bg-rose-100 text-rose-600";
  let mainActionLabel = t("reminder.medicine.markTaken");

  if (isWater) {
    badgeTitle = t("reminder.water.title");
    subText = t("reminder.water.sub");
    Icon = Droplet;
    cardBg = "bg-sky-50 border-sky-200";
    iconBg = "bg-sky-100 text-sky-600";
    mainActionLabel = t("reminder.water.btn");
  } else if (isMeal) {
    badgeTitle = t("reminder.meal.title");
    subText = reminder.notes || t("reminder.meal.sub");
    Icon = Utensils;
    cardBg = "bg-amber-50 border-amber-200";
    iconBg = "bg-amber-100 text-amber-700";
    mainActionLabel = t("reminder.meal.btn");
  }

  const handleMainAction = () => {
    if (isWater && onWaterPrompt) {
      onWaterPrompt(reminder);
    } else {
      onMarkTaken(reminder.id);
    }
  };

  const readoutText = `${badgeTitle}. ${reminder.title} ${reminder.dosage ? reminder.dosage : ""}. Scheduled for ${reminder.time}. ${subText}`;

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm transition-all flex flex-col justify-between ${cardBg}`}
    >
      <div>
        {/* Header row with badge and speak button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-800">
              {badgeTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/80 text-slate-700 border border-slate-200">
              {reminder.time}
            </span>
            <SpeakButton text={readoutText} id={`rem-speak-${reminder.id}`} size="sm" />
          </div>
        </div>

        {/* Title and details */}
        <h3 className="text-lg font-bold text-slate-900 mt-1">
          {reminder.title}
          {reminder.dosage && <span className="ml-1 text-sm font-semibold text-slate-600">({reminder.dosage})</span>}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{subText}</p>
      </div>

      {/* Action buttons: elder-friendly large touch targets */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-slate-200/60">
        <button
          type="button"
          onClick={handleMainAction}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          {mainActionLabel}
        </button>

        <button
          type="button"
          onClick={() => onSnooze(reminder.id)}
          className="inline-flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-300 transition-colors cursor-pointer"
        >
          <Clock className="w-4 h-4 text-slate-500" />
          {t("common.snooze")}
        </button>
      </div>
    </div>
  );
};
