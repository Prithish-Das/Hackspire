import React, { useState } from "react";
import {
  Flame,
  CheckCircle2,
  Clock,
  Pill,
  BookOpen,
  Sparkles,
  Play,
  Info
} from "lucide-react";
import { Patient, Reminder, WaterQuantity } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getReminders,
  updateReminderStatus,
  saveWaterEvent,
  getGameSessions,
  getDomainStats
} from "../../utils/storage";
import { getDomainRecommendations } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";
import { ReminderCard } from "./ReminderCard";
import { WaterConfirmDialog } from "./WaterConfirmDialog";

interface PatientDashboardProps {
  patient: Patient;
  onNavigateToGames: () => void;
  onNavigateToMemoryLane: () => void;
  onNavigateToMedicine: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  onNavigateToGames,
  onNavigateToMemoryLane,
  onNavigateToMedicine
}) => {
  const { t } = useLanguage();

  const [reminders, setReminders] = useState<Reminder[]>(() => getReminders(patient.id));
  const [activeWaterPrompt, setActiveWaterPrompt] = useState<Reminder | null>(null);

  const domainStats = getDomainStats(patient.id);
  const gameSessions = getGameSessions(patient.id);
  const { weakestDomain } = getDomainRecommendations(patient.id);

  // Filter due / upcoming reminders
  const dueReminders = reminders.filter(
    (r) => r.status === "upcoming" || r.status === "snoozed"
  );

  const handleMarkTaken = (id: string) => {
    updateReminderStatus(id, "taken");
    setReminders(getReminders(patient.id));
  };

  const handleSnooze = (id: string) => {
    updateReminderStatus(id, "snoozed", {
      snoozedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
    setReminders(getReminders(patient.id));
  };

  const handleWaterConfirm = (qty: WaterQuantity) => {
    if (activeWaterPrompt) {
      updateReminderStatus(activeWaterPrompt.id, "taken");
      saveWaterEvent({
        id: `we-${Date.now()}`,
        reminderId: activeWaterPrompt.id,
        patientId: patient.id,
        scheduledAt: activeWaterPrompt.time,
        confirmedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "patient_reported_drinking",
        selfReportedQty: qty,
        verificationSource: "self-report"
      });
      setReminders(getReminders(patient.id));
    }
    setActiveWaterPrompt(null);
  };

  // Calculate Cognitive Health Index (CHI)
  const averageDomainScore =
    domainStats.length > 0
      ? Math.round(domainStats.reduce((sum, d) => sum + d.runningAvg, 0) / domainStats.length)
      : 79;
  const chiScore = patient.baselineScore ? Math.round((averageDomainScore + patient.baselineScore) / 2) : 79;

  const todaySessionsCount = gameSessions.length;
  const totalMinutes = todaySessionsCount * 8 + 12; // Realistic active time

  const greeting = t("patient.dashboard.greeting", { name: patient.name });
  const disclaimerText = t("app.disclaimer");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {greeting}
            </h1>
            <SpeakButton text={`${greeting}. ${t("patient.dashboard.chiSubtitle")}`} id="dash-greeting" size="md" />
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            {t("patient.dashboard.chiSubtitle")}
          </p>
        </div>

        {/* Quick Highlights: Streak and Active Time */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              {t("patient.dashboard.streak", { count: 5 })}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              {t("patient.dashboard.activeMinutes", { count: totalMinutes })}
            </span>
          </div>
        </div>
      </div>

      {/* Due Reminders Section (Prominent elder-friendly cards) */}
      {dueReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{t("patient.dashboard.dueReminders")}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {dueReminders.length}
              </span>
            </h2>
            <button
              type="button"
              onClick={onNavigateToMedicine}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              {t("common.view")} All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dueReminders.slice(0, 3).map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onMarkTaken={handleMarkTaken}
                onWaterPrompt={(rem) => setActiveWaterPrompt(rem)}
                onSnooze={handleSnooze}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: CHI Gauge & Today's Recommendation & Domain Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cognitive Health Index (CHI) Gauge */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-base font-bold text-slate-900">
                {t("patient.dashboard.chiTitle")}
              </h2>
              <SpeakButton text={`${t("patient.dashboard.chiTitle")}: ${chiScore} out of 100. ${disclaimerText}`} id="chi-speak" size="sm" />
            </div>

            {/* Circular Gauge Representation */}
            <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-blue-600 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={`${(chiScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-slate-900">{chiScore}</span>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  / 100 Index
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center font-medium leading-relaxed">
              Reflects cognitive engagement and daily activity continuity.
            </p>
          </div>

          {/* Mandatory Non-diagnostic Disclaimer */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
              {disclaimerText}
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Today's Recommendation & 5 Cognitive Domain Bars */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            {/* Recommendation card */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold block">
                    {t("patient.dashboard.recommendation")}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold">
                    Focus: {weakestDomain.domain}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Gentle 5-minute training to keep your mind stimulated.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigateToGames}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {t("patient.dashboard.recommendationBtn")}
              </button>
            </div>

            {/* Five Cognitive Domain Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  {t("patient.dashboard.todayActivity")}
                </h3>
                <span className="text-xs text-slate-500 font-medium">Running Engagement Score</span>
              </div>

              {domainStats.map((stat) => (
                <div key={stat.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{stat.domain}</span>
                    <span className="text-slate-900">{stat.runningAvg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, stat.runningAvg)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onNavigateToGames}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t("nav.patient.games")}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Play all 5 training games</p>
            </button>

            <button
              type="button"
              onClick={onNavigateToMedicine}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Pill className="w-4 h-4" />
                <span>{t("patient.dashboard.medCheck")}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Check medicines & hydration</p>
            </button>

            <button
              type="button"
              onClick={onNavigateToMemoryLane}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>{t("patient.dashboard.memoryShortcut")}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Look through cherished photos</p>
            </button>
          </div>
        </div>
      </div>

      {/* Water Intake Confirmation Dialog */}
      <WaterConfirmDialog
        isOpen={Boolean(activeWaterPrompt)}
        onClose={() => setActiveWaterPrompt(null)}
        onConfirm={handleWaterConfirm}
      />
    </div>
  );
};
