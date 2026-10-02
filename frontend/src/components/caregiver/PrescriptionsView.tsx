import React, { useState } from "react";
import { FileText, Plus, Check, Download, Printer, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Prescription, Reminder } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getPrescriptions, savePrescription, saveReminder, getReminders } from "../../utils/storage";

interface PrescriptionsViewProps {
  patientId: string;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({ patientId }) => {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() =>
    getPrescriptions(patientId)
  );
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [confirmingRx, setConfirmingRx] = useState<Prescription | null>(null);

  const handleAddToSchedule = (rx: Prescription) => {
    // Add each medicine as a reminder in the shared reminder store
    rx.medicines.forEach((med, idx) => {
      // Determine default time based on timing string or fallback
      let scheduleTime = "08:00";
      if (med.timing.toLowerCase().includes("afternoon") || med.timing.includes("14:00")) {
        scheduleTime = "14:00";
      } else if (med.timing.toLowerCase().includes("bedtime") || med.timing.includes("21:00")) {
        scheduleTime = "21:00";
      } else if (med.timing.toLowerCase().includes("night") || med.timing.includes("20:00")) {
        scheduleTime = "20:00";
      }

      const reminder: Reminder = {
        id: `rem-rx-${rx.id}-${idx}-${Date.now()}`,
        patientId,
        type: "medicine",
        title: med.name,
        time: scheduleTime,
        status: "upcoming",
        dosage: med.dosage,
        frequency: med.frequency,
        instructions: med.instructions,
        createdBy: rx.doctorId,
        notes: `Doctor prescribed (${rx.doctorName})`
      };
      saveReminder(reminder);
    });

    const updatedRx = { ...rx, addedToSchedule: true };
    savePrescription(updatedRx);
    setPrescriptions(getPrescriptions(patientId));
    setConfirmingRx(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("nav.caretaker.prescriptions")}</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Review prescriptions issued by the treating physician and synchronize them with daily
            reminders.
          </p>
        </div>
      </div>

      {/* Prescription List */}
      <div className="space-y-4">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  Rx
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{rx.doctorName}</h3>
                  <p className="text-xs text-slate-500">
                    {rx.doctorSpecialty} • {rx.clinicName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {rx.date}
                </span>
                {rx.addedToSchedule ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <Check className="w-3 h-3" />
                    In Daily Schedule
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingRx(rx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("caretaker.addToSchedule")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRx(rx)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {t("common.view")} PDF
                </button>
              </div>
            </div>

            {/* Medicines Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Medicine</th>
                    <th className="pb-2">Dosage</th>
                    <th className="pb-2">Frequency</th>
                    <th className="pb-2">Timing</th>
                    <th className="pb-2">Duration</th>
                    <th className="pb-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rx.medicines.map((med, i) => (
                    <tr key={`rx-m-${i}`}>
                      <td className="py-2.5 font-bold text-slate-900">{med.name}</td>
                      <td className="py-2.5 text-slate-700">{med.dosage}</td>
                      <td className="py-2.5 text-slate-600">{med.frequency}</td>
                      <td className="py-2.5 text-blue-700 font-semibold">{med.timing}</td>
                      <td className="py-2.5 text-slate-600">{med.duration}</td>
                      <td className="py-2.5 text-slate-600">{med.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rx.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-800">Doctor's Clinical Notes: </span>
                <span>{rx.notes}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal to Add to Schedule (§7.8) */}
      {confirmingRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {t("caretaker.confirmSchedule")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              This will create daily medicine reminders for <strong>{confirmingRx.medicines.length} medications</strong> in the shared patient schedule:
            </p>

            <ul className="my-3 space-y-1 text-xs text-slate-700 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
              {confirmingRx.medicines.map((m, idx) => (
                <li key={`cf-m-${idx}`}>
                  <strong>{m.name}</strong> ({m.dosage}) - {m.timing}
                </li>
              ))}
            </ul>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => handleAddToSchedule(confirmingRx)}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm cursor-pointer shadow-sm"
              >
                Yes, Add to Schedule
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRx(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm cursor-pointer"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal (§8.7) */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
              <span className="font-bold text-slate-800 text-sm">Prescription Document Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRx(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>

            {/* Printable Prescription Layout */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5 print:border-none print:p-0">
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">RECALLED</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                    Memory • Attention • Recall
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-slate-900 text-sm">{selectedRx.doctorName}</h3>
                  <p className="text-xs text-slate-600">{selectedRx.doctorSpecialty}</p>
                  <p className="text-[11px] text-slate-400">{selectedRx.clinicName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 text-xs border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-400 font-medium">Patient: </span>
                  <span className="font-bold text-slate-800">Anand Sharma (74 Y)</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium">Prescription Date: </span>
                  <span className="font-bold text-slate-800">{selectedRx.date}</span>
                </div>
              </div>

              {/* Rx Table */}
              <div className="my-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2">#</th>
                      <th className="p-2">Medicine</th>
                      <th className="p-2">Dosage</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Time</th>
                      <th className="p-2">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedRx.medicines.map((m, idx) => (
                      <tr key={`p-rx-${idx}`}>
                        <td className="p-2 text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{m.name}</td>
                        <td className="p-2">{m.dosage}</td>
                        <td className="p-2">{m.frequency}</td>
                        <td className="p-2 font-semibold text-blue-800">{m.timing}</td>
                        <td className="p-2 text-slate-600">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedRx.notes && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold">Instructions & Notes: </span>
                  <span>{selectedRx.notes}</span>
                </div>
              )}

              {/* Signature Area */}
              <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
                <span className="text-[10px]">RECALLED Digital Memory Health Record</span>
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-1" />
                  <span>Physician's Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
