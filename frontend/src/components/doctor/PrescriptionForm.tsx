import React, { useState } from "react";
import { Plus, Trash2, Printer, FileText, Check, Calendar } from "lucide-react";
import { Doctor, Patient, Prescription, PrescriptionMedicine } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { savePrescription, getPrescriptions } from "../../utils/storage";

interface PrescriptionFormProps {
  doctor: Doctor;
  patient: Patient;
  onPrescriptionCreated?: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  doctor,
  patient,
  onPrescriptionCreated
}) => {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      name: "",
      dosage: "",
      frequency: "Once daily",
      timing: "Morning after breakfast (08:00)",
      duration: "30 days",
      instructions: "Take with water"
    }
  ]);
  const [notes, setNotes] = useState("");
  const [successNotice, setSuccessNotice] = useState(false);
  const [previewRx, setPreviewRx] = useState<Prescription | null>(null);

  const pastPrescriptions = getPrescriptions(patient.id);

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "",
        frequency: "Once daily",
        timing: "Morning",
        duration: "30 days",
        instructions: ""
      }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (
    index: number,
    field: keyof PrescriptionMedicine,
    value: string
  ) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMeds = medicines.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) return;

    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      patientId: patient.id,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      clinicName: doctor.clinic,
      date: new Date().toISOString().split("T")[0],
      medicines: validMeds,
      notes: notes.trim(),
      addedToSchedule: false
    };

    savePrescription(newRx);
    setPreviewRx(newRx);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 4000);

    // Reset form
    setMedicines([
      {
        name: "",
        dosage: "",
        frequency: "Once daily",
        timing: "Morning after breakfast (08:00)",
        duration: "30 days",
        instructions: "Take with water"
      }
    ]);
    setNotes("");

    if (onPrescriptionCreated) onPrescriptionCreated();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>{t("doctor.newPrescription")}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prescribing for <strong>{patient.name}</strong> (Age {patient.age}, ID: {patient.id})
            </p>
          </div>

          <div className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            {doctor.name} • {doctor.specialty}
          </div>
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              Prescription recorded successfully! Caretaker can now review and sync with patient's
              schedule.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Prescribed Medications
            </label>

            {medicines.map((med, index) => (
              <div
                key={`med-form-${index}`}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={med.name}
                      onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                      placeholder="e.g. Donepezil Hydrochloride"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                      placeholder="e.g. 5 mg"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                      placeholder="e.g. Once daily"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Timing / Hour
                    </label>
                    <input
                      type="text"
                      value={med.timing}
                      onChange={(e) => handleMedicineChange(index, "timing", e.target.value)}
                      placeholder="e.g. 14:00 After lunch"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                      placeholder="e.g. 90 days"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                    placeholder="Instructions (e.g. Take with half glass of water)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicineRow(index)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddMedicineRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 text-blue-700 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Medicine</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Physician's Clinical Instructions & Lifestyle Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Continue structured 20-minute daily memory exercises. Stay hydrated with scheduled intervals."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              Save & Issue Prescription
            </button>
          </div>
        </form>
      </div>

      {/* Past Prescriptions */}
      {pastPrescriptions.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{t("doctor.pastPrescriptions")}</span>
          </h3>

          <div className="space-y-3">
            {pastPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rx.date}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-700">{rx.medicines.length} medications</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {rx.medicines.map((m) => m.name).join(", ")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewRx(rx)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    View / Print PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Prescription Modal (§8.7) */}
      {previewRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
              <span className="font-bold text-slate-800 text-sm">Prescription PDF Document</span>
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
                  onClick={() => setPreviewRx(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>

            {/* Document layout */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5 print:border-none print:p-0">
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">RECALLED</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                    Memory • Attention • Recall
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-slate-900 text-sm">{previewRx.doctorName}</h3>
                  <p className="text-xs text-slate-600">{previewRx.doctorSpecialty}</p>
                  <p className="text-[11px] text-slate-400">{previewRx.clinicName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 text-xs border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-400 font-medium">Patient: </span>
                  <span className="font-bold text-slate-800">{patient.name} ({patient.age} Y)</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium">Prescription Date: </span>
                  <span className="font-bold text-slate-800">{previewRx.date}</span>
                </div>
              </div>

              {/* Medicines Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2">#</th>
                    <th className="p-2">Medicine</th>
                    <th className="p-2">Dosage</th>
                    <th className="p-2">Frequency</th>
                    <th className="p-2">Timing</th>
                    <th className="p-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewRx.medicines.map((m, idx) => (
                    <tr key={`prv-m-${idx}`}>
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

              {previewRx.notes && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold">Instructions & Notes: </span>
                  <span>{previewRx.notes}</span>
                </div>
              )}

              {/* Signature area with blank line */}
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
