import React, { useState } from "react";
import {
  Pill,
  Droplet,
  Utensils,
  Check,
  RotateCcw,
  Clock,
  FileText,
  Calendar
} from "lucide-react";
import { Patient, Reminder, WaterQuantity } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getReminders,
  updateReminderStatus,
  saveWaterEvent,
  getWaterEvents,
  getPrescriptions
} from "../../utils/storage";
import { SpeakButton } from "../common/SpeakButton";
import { WaterConfirmDialog } from "./WaterConfirmDialog";

interface MedicinePageProps {
  patient: Patient;
}

export const MedicinePage: React.FC<MedicinePageProps> = ({ patient }) => {
  const { t } = useLanguage();

  const [reminders, setReminders] = useState<Reminder[]>(() => getReminders(patient.id));
  const [waterEvents, setWaterEvents] = useState(() => getWaterEvents(patient.id));
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);

  const prescriptions = getPrescriptions(patient.id);
  const activePrescription = prescriptions[0];

  const handleMarkTaken = (id: string) => {
    updateReminderStatus(id, "taken");
    setReminders(getReminders(patient.id));
  };

  const handleUndo = (id: string) => {
    updateReminderStatus(id, "upcoming");
    setReminders(getReminders(patient.id));
  };

  const handleWaterConfirm = (qty: WaterQuantity) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    saveWaterEvent({
      id: `we-${Date.now()}`,
      patientId: patient.id,
      scheduledAt: timeStr,
      confirmedAt: timeStr,
      status: "patient_reported_drinking",
      selfReportedQty: qty,
      verificationSource: "self-report"
    });
    setWaterEvents(getWaterEvents(patient.id));
    setIsWaterModalOpen(false);
  };

  // Filter medicines vs meals vs water
  const medicineList = reminders.filter((r) => r.type === "medicine");
  const mealList = reminders.filter((r) => r.type === "meal");

  // Calculate adherence rate
  const totalMeds = medicineList.length;
  const takenMeds = medicineList.filter((r) => r.status === "taken").length;
  const adherenceRate = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 100;

  const pageTitle = t("medicine.title");
  const pageSub = t("medicine.subtitle");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
            <SpeakButton text={`${pageTitle}. ${pageSub}`} id="med-page-speak" size="sm" />
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">{pageSub}</p>
        </div>

        {/* Adherence Rate Badge */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            {adherenceRate}%
          </div>
          <div>
            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">
              {t("medicine.adherenceRate", { rate: adherenceRate })}
            </span>
            <span className="text-xs text-slate-600">
              {takenMeds} of {totalMeds} taken today
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Medicines & Water/Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Scheduled Medicines List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              <span>Today's Scheduled Medicines</span>
            </h2>
            <span className="text-xs font-medium text-slate-500">Shared with Caretaker & Doctor</span>
          </div>

          <div className="space-y-3">
            {medicineList.map((med) => {
              const isTaken = med.status === "taken";
              const isMissed = med.status === "missed";
              const isSnoozed = med.status === "snoozed";

              const medSpeech = `${med.title}, dosage ${med.dosage || ""}, scheduled for ${med.time}. Status is ${isTaken ? "taken" : isMissed ? "missed" : "upcoming"}. ${med.instructions || ""}`;

              return (
                <div
                  key={med.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isTaken
                      ? "bg-emerald-50/70 border-emerald-300"
                      : isMissed
                      ? "bg-rose-50 border-rose-300"
                      : isSnoozed
                      ? "bg-amber-50 border-amber-300"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {med.time}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{med.title}</h3>
                      {med.dosage && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {med.dosage}
                        </span>
                      )}
                      <SpeakButton text={medSpeech} id={`med-item-${med.id}`} size="sm" />
                    </div>
                    {med.instructions && (
                      <p className="text-xs sm:text-sm text-slate-600 pl-0.5">{med.instructions}</p>
                    )}
                    {med.frequency && (
                      <p className="text-[11px] text-slate-500 pl-0.5 font-medium">
                        Schedule: {med.frequency}
                      </p>
                    )}
                  </div>

                  {/* Elder-friendly Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {isTaken ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold">
                          <Check className="w-4 h-4" />
                          {t("common.taken")}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUndo(med.id)}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkTaken(med.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        {t("medicine.markTaken")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Read-Only Doctor Prescription Section */}
          {activePrescription && (
            <div className="mt-8 bg-blue-50/50 rounded-2xl border border-blue-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    {t("medicine.prescriptionSection")}
                  </h3>
                </div>
                <span className="text-xs text-slate-600 font-semibold">
                  Prescribed by {activePrescription.doctorName}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {activePrescription.medicines.map((m, idx) => (
                  <div
                    key={`rx-med-${idx}`}
                    className="p-3 bg-white rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-slate-600 ml-2 font-medium">({m.dosage})</span>
                      <p className="text-slate-500 text-xs mt-0.5">{m.instructions}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded-md shrink-0">
                      {m.timing}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Water Hydration & Meals */}
        <div className="space-y-6">
          {/* Water Hydration Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Droplet className="w-5 h-5 fill-sky-500" />
                </div>
                <h3 className="font-bold text-slate-900">{t("medicine.waterSection")}</h3>
              </div>
              <SpeakButton text="Water Hydration Log. Report drinking water to keep your daily care record updated." id="water-log-speak" size="sm" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Staying comfortably hydrated is an important part of your daily health routine.
            </p>

            <button
              type="button"
              onClick={() => setIsWaterModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm cursor-pointer active:scale-95"
            >
              <Droplet className="w-4 h-4 fill-white" />
              {t("reminder.water.btn")}
            </button>

            {/* Today's Water Events */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                Today's Water Confirmations
              </span>
              {waterEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No water reported yet today.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {waterEvents.map((we) => (
                    <div
                      key={we.id}
                      className="p-2 rounded-lg bg-sky-50 text-xs text-sky-900 border border-sky-100 flex items-center justify-between"
                    >
                      <span>
                        💧 {we.confirmedAt || we.scheduledAt} • {t("water.status.reported")}
                      </span>
                      <span className="font-semibold capitalize text-sky-700">
                        {we.selfReportedQty?.replace("_", " ") || "1 glass"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meals Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t("medicine.mealsSection")}</h3>
              </div>
            </div>

            <div className="space-y-2">
              {mealList.map((meal) => {
                const isCompleted = meal.status === "completed" || meal.status === "taken";

                return (
                  <div
                    key={meal.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{meal.title}</span>
                      <span className="text-slate-500 ml-2">({meal.time})</span>
                      {meal.notes && <p className="text-xs text-slate-500 mt-0.5">{meal.notes}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        isCompleted ? handleUndo(meal.id) : handleMarkTaken(meal.id)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                      }`}
                    >
                      {isCompleted ? "✓ " + t("common.done") : t("common.markTaken")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Water Confirmation Modal */}
      <WaterConfirmDialog
        isOpen={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
        onConfirm={handleWaterConfirm}
      />
    </div>
  );
};
