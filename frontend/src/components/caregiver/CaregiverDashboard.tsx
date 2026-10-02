import React, { useState } from "react";
import {
  User,
  Heart,
  Clock,
  Pill,
  Droplet,
  Plus,
  MessageSquare,
  AlertCircle,
  FileText,
  Calendar,
  Phone
} from "lucide-react";
import { Patient, Reminder, CaregiverNote } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getPatients,
  getReminders,
  getCaregiverNotes,
  saveCaregiverNote,
  saveReminder,
  getWaterEvents,
  getAlerts
} from "../../utils/storage";
import { CareTimeline } from "./CareTimeline";
import { WeeklyWaterChart } from "./WeeklyWaterChart";

interface CaregiverDashboardProps {
  currentPatient: Patient;
  onSelectPatient: (patientId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  currentPatient,
  onSelectPatient,
  onNavigateToTab
}) => {
  const { t } = useLanguage();
  const allPatients = getPatients();
  const reminders = getReminders(currentPatient.id);
  const waterEvents = getWaterEvents(currentPatient.id);
  const alerts = getAlerts(currentPatient.id).filter((a) => !a.resolved);
  const [notes, setNotes] = useState<CaregiverNote[]>(() => getCaregiverNotes(currentPatient.id));

  // Add Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteMood, setNoteMood] = useState("Cheerful & Engaged");

  // Add Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [remTitle, setRemTitle] = useState("");
  const [remType, setRemType] = useState<"medicine" | "water" | "meal" | "general">("medicine");
  const [remTime, setRemTime] = useState("09:00");
  const [remDosage, setRemDosage] = useState("");
  const [remNotes, setRemNotes] = useState("");

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote: CaregiverNote = {
      id: `cn-${Date.now()}`,
      patientId: currentPatient.id,
      authorId: "c1",
      authorName: "Priya Sharma",
      text: noteText.trim(),
      date: new Date().toISOString().split("T")[0],
      mood: noteMood
    };

    saveCaregiverNote(newNote);
    setNotes(getCaregiverNotes(currentPatient.id));
    setIsNoteModalOpen(false);
    setNoteText("");
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      patientId: currentPatient.id,
      type: remType,
      title: remTitle.trim(),
      time: remTime,
      status: "upcoming",
      dosage: remDosage.trim() || undefined,
      notes: remNotes.trim() || undefined,
      createdBy: "c1"
    };

    saveReminder(newRem);
    setIsReminderModalOpen(false);
    setRemTitle("");
    setRemDosage("");
    setRemNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Patient Selector & Info Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
            {currentPatient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Active Patient Record
              </span>
              <span className="text-xs text-slate-500">ID: {currentPatient.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {currentPatient.name}
            </h1>
            <p className="text-xs text-slate-500">
              Age {currentPatient.age} • {currentPatient.region} • Primary Contact:{" "}
              {currentPatient.emergencyContact?.phone}
            </p>
          </div>
        </div>

        {/* Patient Switcher for Caregiver */}
        <div className="flex flex-wrap items-center gap-3">
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
        </div>
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
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            + Add Note
          </button>
        </div>

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
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add Scheduled Care Reminder</h3>
            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
                <select
                  value={remType}
                  onChange={(e) => setRemType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="medicine">Medicine</option>
                  <option value="water">Water Hydration</option>
                  <option value="meal">Meal</option>
                  <option value="general">General Care</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dosage (if medicine)
                  </label>
                  <input
                    type="text"
                    value={remDosage}
                    onChange={(e) => setRemDosage(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
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
