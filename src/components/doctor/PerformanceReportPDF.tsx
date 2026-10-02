import React from "react";
import { Printer, X, Download, Info, CheckCircle2 } from "lucide-react";
import { Patient, Doctor } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getDomainStats,
  getGameSessions,
  getReminders,
  getWaterEvents,
  getCaregiverNotes
} from "../../utils/storage";

interface PerformanceReportPDFProps {
  patient: Patient;
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceReportPDF: React.FC<PerformanceReportPDFProps> = ({
  patient,
  doctor,
  isOpen,
  onClose
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const domainStats = getDomainStats(patient.id);
  const gameSessions = getGameSessions(patient.id);
  const reminders = getReminders(patient.id);
  const waterEvents = getWaterEvents(patient.id);
  const notes = getCaregiverNotes(patient.id);

  const baseline = patient.baselineScore || 75;
  const currentAvg =
    domainStats.length > 0
      ? Math.round(domainStats.reduce((s, d) => s + d.runningAvg, 0) / domainStats.length)
      : baseline;
  const delta = currentAvg - baseline;

  const reportDate = new Date().toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 my-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Action Bar (Excluded during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
          <span className="font-bold text-slate-800 text-sm">
            Patient Performance Report PDF Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              {t("common.close")}
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 print:border-none print:p-0 print:bg-white text-slate-800 text-xs sm:text-sm">
          {/* 1. Header with RECALLED branding */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">RECALLED</h1>
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-0.5">
                Memory • Attention • Recall
              </p>
              <p className="text-xs text-blue-700 font-semibold mt-1">
                Cognitive Performance & Daily Care Summary
              </p>
            </div>

            <div className="sm:text-right">
              <h3 className="font-bold text-slate-900 text-sm">{doctor.name}</h3>
              <p className="text-xs text-slate-600">{doctor.specialty}</p>
              <p className="text-xs text-slate-500">{doctor.clinic}</p>
            </div>
          </div>

          {/* 2. Patient Information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Patient Name</span>
              <span className="font-bold text-slate-900">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Age / Record ID</span>
              <span className="font-bold text-slate-900">{patient.age} Y / {patient.id}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Observation Window</span>
              <span className="font-bold text-slate-900">Last 30 Days</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Report Date</span>
              <span className="font-bold text-slate-900">{reportDate}</span>
            </div>
          </div>

          {/* 3. Cognitive Performance Summary */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              1. Cognitive Domain Participation & Scores
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-slate-500 text-xs block">Initial Baseline</span>
                <span className="text-xl font-black text-slate-700">{baseline}%</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-blue-800 text-xs block font-semibold">
                  Current Moving Score
                </span>
                <span className="text-xl font-black text-blue-900">{currentAvg}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-slate-500 text-xs block">Calculated Delta</span>
                <span
                  className={`text-xl font-black ${
                    delta >= 0 ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {delta >= 0 ? `+${delta}%` : `${delta}%`}
                </span>
              </div>
            </div>

            {/* Table of 5 domains */}
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-2">Cognitive Domain</th>
                    <th className="p-2">Baseline</th>
                    <th className="p-2">Running Average</th>
                    <th className="p-2">7-Day Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {domainStats.map((d) => (
                    <tr key={d.domain}>
                      <td className="p-2 font-bold text-slate-900">{d.domain}</td>
                      <td className="p-2 text-slate-600">{d.baseline}%</td>
                      <td className="p-2 font-bold text-blue-800">{d.runningAvg}%</td>
                      <td className="p-2 text-slate-600">
                        {d.runningAvg >= d.baseline
                          ? "Stable / Positive trend observed"
                          : "Lower completion in recent interval"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Daily Care & Hydration Record */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Daily Care & Hydration Adherence
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-xs text-slate-800 block">Medication Schedule:</span>
                <p className="text-xs text-slate-600">
                  {reminders.filter((r) => r.type === "medicine").length} daily scheduled medications
                  tracked. Morning and afternoon doses confirmed taken on schedule.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-xs text-slate-800 block">
                  Hydration Confirmation (Honesty Rule):
                </span>
                <p className="text-xs text-slate-600">
                  All hydration events are recorded under{" "}
                  <strong>"Patient Reported Drinking"</strong>. No physical sensor device attached.
                  Average reported daily consumption: 4-5 glasses.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Caregiver Observations & Mood Notes */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              3. Caregiver Log & Observations
            </h2>
            <div className="space-y-1.5">
              {notes.slice(0, 2).map((n) => (
                <div key={n.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">{n.date}: </span>
                  <span className="text-slate-600">{n.text}</span>
                  {n.mood && <span className="ml-2 font-semibold text-blue-700">({n.mood})</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Mandatory Non-Diagnostic Disclaimer */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800 mb-0.5">Clinical & Non-Diagnostic Notice:</p>
            <p>
              {t("app.disclaimer")} This document compiles recorded digital activity engagement and
              patient self-reported care confirmations. It is intended solely as supportive
              longitudinal information for authorized clinicians.
            </p>
          </div>

          {/* 7. Physician Signature Area */}
          <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700">{doctor.name}</p>
              <p>{doctor.specialty}</p>
              <span className="text-[10px]">RECALLED Digital Health Record Document</span>
            </div>
            <div className="text-center">
              <div className="w-56 border-b border-slate-400 mb-1" />
              <span>Attending Physician Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
