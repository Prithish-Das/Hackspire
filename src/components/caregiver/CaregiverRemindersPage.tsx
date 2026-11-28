import React, { useState, useEffect, useCallback } from "react";
import {
  BellRing,
  Plus,
  Edit3,
  Trash2,
  Power,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pill,
  Droplet,
  Activity,
  Stethoscope,
  Calendar,
  Sparkles,
  X,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import {
  Patient,
  Reminder,
  ReminderCategory,
  RepeatFrequency,
  User
} from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getAccessiblePatientsForUser,
  getReminderCategory,
  getReminders,
  isReminderCompleted,
  isReminderOverdue
} from "../../utils/storage";
import {
  createReminderApi,
  deleteReminderApi,
  fetchPatientReminders,
  updateReminderApi
} from "../../services/connectionApi";

interface CaregiverRemindersPageProps {
  user: User;
  currentPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const CATEGORIES: ReminderCategory[] = [
  "Medicine",
  "Water Intake",
  "Exercise",
  "Daily Activity",
  "Doctor Appointment",
  "Custom Reminder"
];

const REPEAT_OPTIONS: RepeatFrequency[] = ["none", "daily", "weekly", "custom"];

type FilterTab = "all" | "upcoming" | "overdue" | "completed" | "inactive";

function getCategoryStyle(category: ReminderCategory) {
  switch (category) {
    case "Medicine":
      return {
        icon: Pill,
        badge: "bg-rose-50 text-rose-800 border-rose-200",
        iconBg: "bg-rose-100 text-rose-700"
      };
    case "Water Intake":
      return {
        icon: Droplet,
        badge: "bg-sky-50 text-sky-800 border-sky-200",
        iconBg: "bg-sky-100 text-sky-700"
      };
    case "Exercise":
      return {
        icon: Activity,
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        iconBg: "bg-emerald-100 text-emerald-700"
      };
    case "Daily Activity":
      return {
        icon: Calendar,
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        iconBg: "bg-amber-100 text-amber-700"
      };
    case "Doctor Appointment":
      return {
        icon: Stethoscope,
        badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
        iconBg: "bg-indigo-100 text-indigo-700"
      };
    default:
      return {
        icon: Sparkles,
        badge: "bg-slate-100 text-slate-800 border-slate-200",
        iconBg: "bg-slate-200 text-slate-700"
      };
  }
}

export const CaregiverRemindersPage: React.FC<CaregiverRemindersPageProps> = ({
  user,
  currentPatient,
  onSelectPatient,
  onNavigateToTab
}) => {
  const { t } = useLanguage();
  const connectedPatients = getAccessiblePatientsForUser(user);

  const [reminders, setReminders] = useState<Reminder[]>(() =>
    currentPatient ? getReminders(currentPatient.id) : []
  );
  const [statusFilter, setStatusFilter] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<ReminderCategory | "all">("all");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReminderCategory>("Medicine");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>("daily");
  const [customRepeatNote, setCustomRepeatNote] = useState("");
  const [dosage, setDosage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);

  const loadReminders = useCallback(async () => {
    if (!currentPatient) {
      setReminders([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchPatientReminders(user, currentPatient.id);
      setReminders(list);
    } finally {
      setLoading(false);
    }
  }, [user, currentPatient]);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  if (!currentPatient || connectedPatients.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <BellRing className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{t("reminders.pageTitle")}</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">{t("connections.noPatients")}</p>
        <button
          type="button"
          onClick={() => onNavigateToTab("patients")}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer"
        >
          {t("connections.addPatient")}
        </button>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingReminder(null);
    setTitle("");
    setDescription("");
    setCategory("Medicine");
    setScheduledDate(new Date().toISOString().split("T")[0]);
    setScheduledTime("09:00");
    setRepeatFrequency("daily");
    setCustomRepeatNote("");
    setDosage("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (rem: Reminder) => {
    setEditingReminder(rem);
    setTitle(rem.title);
    setDescription(rem.description || rem.notes || rem.instructions || "");
    setCategory(getReminderCategory(rem));
    setScheduledDate(rem.scheduledDate || new Date().toISOString().split("T")[0]);
    setScheduledTime(rem.scheduledTime || rem.time || "09:00");
    setRepeatFrequency(rem.repeatFrequency || "daily");
    setCustomRepeatNote(rem.customRepeatNote || "");
    setDosage(rem.dosage || "");
    setIsActive(rem.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentPatient) return;

    setSubmitting(true);
    setBanner(null);

    if (editingReminder) {
      const res = await updateReminderApi(user, editingReminder.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        scheduledDate,
        scheduledTime,
        repeatFrequency,
        customRepeatNote: repeatFrequency === "custom" ? customRepeatNote.trim() : "",
        dosage: dosage.trim(),
        isActive
      });
      setSubmitting(false);

      if (!res.ok) {
        setBanner({ type: "error", text: res.error || "Unable to update reminder." });
        return;
      }
      setBanner({
        type: "success",
        text: `Updated reminder "${title.trim()}" for ${currentPatient.name}.`
      });
    } else {
      const res = await createReminderApi(user, {
        patientId: currentPatient.id,
        title: title.trim(),
        description: description.trim(),
        category,
        scheduledDate,
        scheduledTime,
        repeatFrequency,
        customRepeatNote: repeatFrequency === "custom" ? customRepeatNote.trim() : undefined,
        dosage: dosage.trim() || undefined,
        isActive
      });
      setSubmitting(false);

      if (!res.ok) {
        setBanner({ type: "error", text: res.error || "Unable to create reminder." });
        return;
      }
      setBanner({
        type: "success",
        text: `Created reminder "${title.trim()}" for ${currentPatient.name}.`
      });
    }

    setIsModalOpen(false);
    await loadReminders();
  };

  const handleToggleActive = async (rem: Reminder) => {
    setBanner(null);
    const nextActive = rem.isActive === false;
    const res = await updateReminderApi(user, rem.id, { isActive: nextActive });
    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Unable to change reminder status." });
      return;
    }
    setBanner({
      type: "success",
      text: `"${rem.title}" marked as ${nextActive ? "Active" : "Inactive"}.`
    });
    await loadReminders();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBanner(null);
    const res = await deleteReminderApi(user, deleteTarget.id);
    const deletedTitle = deleteTarget.title;
    setDeleteTarget(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Unable to delete reminder." });
      return;
    }
    setBanner({ type: "success", text: `Deleted reminder "${deletedTitle}".` });
    await loadReminders();
  };

  // Counts for summary & filter tabs
  const upcomingList = reminders.filter(
    (r) => r.isActive !== false && !isReminderCompleted(r) && !isReminderOverdue(r)
  );
  const overdueList = reminders.filter((r) => isReminderOverdue(r));
  const completedList = reminders.filter((r) => isReminderCompleted(r));
  const inactiveList = reminders.filter((r) => r.isActive === false);

  const filteredReminders = reminders
    .filter((r) => {
      if (statusFilter === "upcoming") {
        return r.isActive !== false && !isReminderCompleted(r) && !isReminderOverdue(r);
      }
      if (statusFilter === "overdue") return isReminderOverdue(r);
      if (statusFilter === "completed") return isReminderCompleted(r);
      if (statusFilter === "inactive") return r.isActive === false;
      return true;
    })
    .filter((r) => (categoryFilter === "all" ? true : getReminderCategory(r) === categoryFilter))
    .sort((a, b) => (a.scheduledTime || a.time).localeCompare(b.scheduledTime || b.time));

  return (
    <div className="space-y-6">
      {/* Header with Patient Selector & Create CTA */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">{t("reminders.pageTitle")}</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1">{t("reminders.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentPatient.id}
            onChange={(e) => onSelectPatient(e.target.value)}
            aria-label="Select patient"
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {connectedPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.age} Y)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("reminders.createNew")}</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {banner && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-semibold ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t("reminders.filter.upcoming")}</span>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">{upcomingList.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t("reminders.filter.overdue")}</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{overdueList.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t("reminders.filter.completed")}</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{completedList.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t("reminders.filter.inactive")}</span>
          <div className="text-2xl font-extrabold text-slate-500 mt-1">{inactiveList.length}</div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "upcoming", "overdue", "completed", "inactive"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                statusFilter === tab
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {t(`reminders.filter.${tab}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">
            {t("reminders.categoryLabel")}:
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ReminderCategory | "all")}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">{t("reminders.filter.all")}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`reminder.category.${cat}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {loading && <div className="text-xs text-slate-400">{t("common.loading")}</div>}

        {filteredReminders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
            {t("reminders.noRemindersMatch")}
          </div>
        ) : (
          filteredReminders.map((rem) => {
            const cat = getReminderCategory(rem);
            const style = getCategoryStyle(cat);
            const CatIcon = style.icon;
            const completed = isReminderCompleted(rem);
            const overdue = isReminderOverdue(rem);
            const inactive = rem.isActive === false;

            return (
              <div
                key={rem.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  inactive
                    ? "border-slate-200 opacity-70 bg-slate-50"
                    : completed
                    ? "border-emerald-200 bg-emerald-50/30"
                    : overdue
                    ? "border-amber-300 bg-amber-50/30"
                    : "border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${style.badge}`}>
                        {t(`reminder.category.${cat}`)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
                        {rem.scheduledDate || ""} • {rem.scheduledTime || rem.time}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        {t(`reminder.repeat.${rem.repeatFrequency || "daily"}`)}
                      </span>
                      {inactive && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-bold">
                          {t("common.inactive")}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {rem.title}
                      {rem.dosage && (
                        <span className="ml-2 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {rem.dosage}
                        </span>
                      )}
                    </h3>

                    {(rem.description || rem.notes || rem.instructions) && (
                      <p className="text-xs sm:text-sm text-slate-600">
                        {rem.description || rem.notes || rem.instructions}
                      </p>
                    )}

                    {rem.repeatFrequency === "custom" && rem.customRepeatNote && (
                      <p className="text-xs text-indigo-700 font-medium">
                        Schedule note: {rem.customRepeatNote}
                      </p>
                    )}

                    {/* Completion / Overdue Indicator */}
                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                      {completed ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {rem.completedAt
                              ? t("reminders.completedAt", {
                                  time: new Date(rem.completedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                })
                              : t("common.completed")}
                          </span>
                        </span>
                      ) : overdue && !inactive ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{t("reminders.filter.overdue")}</span>
                        </span>
                      ) : !inactive ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                          <Clock className="w-4 h-4" />
                          <span>{t("common.upcoming")}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Caregiver Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(rem)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t("common.edit")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(rem)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                      inactive
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{inactive ? t("reminders.activate") : t("reminders.deactivate")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(rem)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("common.delete")}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingReminder ? t("reminders.editReminder") : t("reminders.createNew")}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.categoryLabel")} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`reminder.category.${cat}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.repeatLabel")} *
                  </label>
                  <select
                    value={repeatFrequency}
                    onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {REPEAT_OPTIONS.map((freq) => (
                      <option key={freq} value={freq}>
                        {t(`reminder.repeat.${freq}`)}
                      </option>
                    ))}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Evening Walk in the Park"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {repeatFrequency === "custom" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.customRepeatLabel")}
                  </label>
                  <input
                    type="text"
                    value={customRepeatNote}
                    onChange={(e) => setCustomRepeatNote(e.target.value)}
                    placeholder="e.g. Every Monday, Wednesday, Friday"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.dateLabel")} *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.timeLabel")} *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {category === "Medicine" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("reminders.dosageLabel")}
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 1 tablet (5 mg)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("reminders.descriptionLabel")}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Clear, gentle instructions for the patient..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">{t("reminders.activeLabel")}</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm cursor-pointer"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t("reminders.deleteConfirmTitle")}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("reminders.deleteConfirmBody", { title: deleteTarget.title })}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
