import React, { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  MessageSquare,
  AlertCircle,
  Phone,
  Users,
  BellRing,
  UserPlus
} from "lucide-react";
import {
  Patient,
  Reminder,
  ReminderCategory,
  RepeatFrequency,
  CaregiverNote,
  User as UserType
} from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getAccessiblePatientsForUser,
  getCurrentUser,
  getReminders,
  getCaregiverNotes,
  saveCaregiverNote,
  getWaterEvents,
  getAlerts,
  getConnectedPatientSummariesForCaregiver
} from "../../utils/storage";
import { createReminderApi, fetchPatientReminders } from "../../services/connectionApi";
import { CareTimeline } from "./CareTimeline";
import { WeeklyWaterChart } from "./WeeklyWaterChart";

interface CaregiverDashboardProps {
  user?: UserType;
  currentPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  user,
  currentPatient,
  onSelectPatient,
  onNavigateToTab
}) => {
  const { t } = useLanguage();
  const activeUser = user || getCurrentUser();
  const allPatients = getAccessiblePatientsForUser(activeUser);
  const patientSummaries = activeUser?.caretakerId
    ? getConnectedPatientSummariesForCaregiver(activeUser.caretakerId)
    : [];

  const [reminders, setReminders] = useState<Reminder[]>(() =>
    currentPatient ? getReminders(currentPatient.id) : []
  );
  const waterEvents = currentPatient ? getWaterEvents(currentPatient.id) : [];
  const alerts = currentPatient ? getAlerts(currentPatient.id).filter((a) => !a.resolved) : [];
  const [notes, setNotes] = useState<CaregiverNote[]>(() =>
    currentPatient ? getCaregiverNotes(currentPatient.id) : []
  );

  useEffect(() => {
    if (!currentPatient) {
      setNotes([]);
      setReminders([]);
      return;
    }
    setNotes(getCaregiverNotes(currentPatient.id));
    setReminders(getReminders(currentPatient.id));
    let mounted = true;
    void fetchPatientReminders(activeUser, currentPatient.id).then((list) => {
      if (mounted) setReminders(list);
    });
    return () => {
      mounted = false;
    };
  }, [currentPatient?.id, activeUser?.id]);

  // Add Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteMood, setNoteMood] = useState("Cheerful & Engaged");

  // Add Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [remTitle, setRemTitle] = useState("");
  const [remCategory, setRemCategory] = useState<ReminderCategory>("Medicine");
  const [remDate, setRemDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [remTime, setRemTime] = useState("09:00");
  const [remRepeat, setRemRepeat] = useState<RepeatFrequency>("daily");
  const [remDosage, setRemDosage] = useState("");
  const [remNotes, setRemNotes] = useState("");

  if (!currentPatient || allPatients.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          {t("connections.myPatientsTitle")}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {t("connections.noPatients")}
        </p>
        <button
          type="button"
          onClick={() => onNavigateToTab("patients")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t("connections.addPatient")}</span>
        </button>
      </div>
    );
  }

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote: CaregiverNote = {
      id: `cn-${Date.now()}`,
      patientId: currentPatient.id,
      authorId: activeUser?.caretakerId || "c1",
      authorName: activeUser?.name || "Priya Sharma",
      text: noteText.trim(),
      date: new Date().toISOString().split("T")[0],
      mood: noteMood
    };

    saveCaregiverNote(newNote);
    setNotes(getCaregiverNotes(currentPatient.id));
    setIsNoteModalOpen(false);
    setNoteText("");
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !activeUser) return;

    await createReminderApi(activeUser, {
      patientId: currentPatient.id,
      title: remTitle.trim(),
      description: remNotes.trim(),
      category: remCategory,
      scheduledDate: remDate,
      scheduledTime: remTime,
      repeatFrequency: remRepeat,
      dosage: remDosage.trim() || undefined,
      isActive: true
    });

    setReminders(getReminders(currentPatient.id));
    setIsReminderModalOpen(false);
    setRemTitle("");
    setRemDosage("");
    setRemNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Patient Selector & Info Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
              {currentPatient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Active Patient Record
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {currentPatient.inviteCode || currentPatient.id}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {currentPatient.name}
              </h1>
              <p className="text-xs text-slate-500">
                Age {currentPatient.age} • {currentPatient.region}
                {currentPatient.emergencyContact?.phone
                  ? ` • Primary Contact: ${currentPatient.emergencyContact.phone}`
                  : ""}
              </p>
            </div>
          </div>

          {/* Patient Switcher for Caregiver + Connect CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-xs font-semibold text-slate-500">Select Patient:</label>
            <select
              value={currentPatient.id}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age} Y)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onNavigateToTab("patients")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("connections.addPatient")}</span>
            </button>
          </div>
        </div>

        {/* Multi-Patient Quick Switch Pills (when caregiver manages multiple patients) */}
        {patientSummaries.length > 1 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            {patientSummaries.map((item) => {
              const active = item.patient.id === currentPatient.id;
              return (
                <button
                  key={item.patient.id}
                  type="button"
                  onClick={() => onSelectPatient(item.patient.id)}
                  className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    active
                      ? "bg-blue-50 border-blue-400 text-blue-950 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-700">
                    {item.patient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.patient.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {item.pendingRemindersCount} pending • {item.averageScore}% avg
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setIsReminderModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("caretaker.addReminder")}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab("reminders")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <BellRing className="w-4 h-4 text-emerald-700" />
          <span>{t("connections.manageReminders")}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNoteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>{t("caretaker.addNote")}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab("alerts")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>
            {t("nav.caretaker.alerts")} ({alerts.length})
          </span>
        </button>

        <a
          href={`tel:${currentPatient.emergencyContact?.phone || "+91 98765 43210"}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm cursor-pointer ml-auto"
        >
          <Phone className="w-4 h-4 text-slate-600" />
          <span>Call Patient</span>
        </a>
      </div>

      {/* Grid: Care Timeline & Weekly Water Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CareTimeline reminders={reminders} />
        <WeeklyWaterChart waterEvents={waterEvents} />
      </div>

      {/* Caregiver Notes Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Caregiver Daily Observation Notes</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            + Add Note
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">No observation notes recorded for this patient yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{note.authorName}</span>
                  <span className="text-xs text-slate-400 font-medium">{note.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{note.text}</p>
                {note.mood && (
                  <div className="pt-1 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-indigo-500" />
                    <span>Observed Mood: {note.mood}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add Daily Caregiver Note</h3>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observed Mood / Engagement
                </label>
                <select
                  value={noteMood}
                  onChange={(e) => setNoteMood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Cheerful & Engaged">Cheerful & Engaged</option>
                  <option value="Calm & Attentive">Calm & Attentive</option>
                  <option value="Slightly Fatigued">Slightly Fatigued</option>
                  <option value="Quiet / Restful">Quiet / Restful</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Observation Note *
                </label>
                <textarea
                  rows={3}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record meal appetite, walk comfort, cognitive activity feedback..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm cursor-pointer"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              {t("reminders.createNew")} — {currentPatient.name}
            </h3>
            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.categoryLabel")} *
                  </label>
                  <select
                    value={remCategory}
                    onChange={(e) => setRemCategory(e.target.value as ReminderCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Medicine">{t("reminder.category.Medicine")}</option>
                    <option value="Water Intake">{t("reminder.category.Water Intake")}</option>
                    <option value="Exercise">{t("reminder.category.Exercise")}</option>
                    <option value="Daily Activity">{t("reminder.category.Daily Activity")}</option>
                    <option value="Doctor Appointment">
                      {t("reminder.category.Doctor Appointment")}
                    </option>
                    <option value="Custom Reminder">{t("reminder.category.Custom Reminder")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.repeatLabel")}
                  </label>
                  <select
                    value={remRepeat}
                    onChange={(e) => setRemRepeat(e.target.value as RepeatFrequency)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="none">{t("reminder.repeat.none")}</option>
                    <option value="daily">{t("reminder.repeat.daily")}</option>
                    <option value="weekly">{t("reminder.repeat.weekly")}</option>
                    <option value="custom">{t("reminder.repeat.custom")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("reminders.titleLabel")} *
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Calcium Supplement"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.dateLabel")} *
                  </label>
                  <input
                    type="date"
                    required
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.timeLabel")} *
                  </label>
                  <input
                    type="time"
                    required
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {remCategory === "Medicine" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.dosageLabel")}
                  </label>
                  <input
                    type="text"
                    value={remDosage}
                    onChange={(e) => setRemDosage(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("reminders.descriptionLabel")}
                </label>
                <input
                  type="text"
                  value={remNotes}
                  onChange={(e) => setRemNotes(e.target.value)}
                  placeholder="e.g. Take after breakfast"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm cursor-pointer"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
