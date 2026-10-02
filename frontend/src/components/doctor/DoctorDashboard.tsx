import React, { useState } from "react";
import {
  Search,
  User,
  TrendingUp,
  FileText,
  Printer,
  Calendar,
  Activity,
  Droplet,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { Doctor, Patient } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getPatients,
  getDomainStats,
  getGameSessions,
  getWaterEvents,
  getPrescriptions
} from "../../utils/storage";
import { MemoryImprovement } from "./MemoryImprovement";
import { WeeklyMemoryChart } from "./WeeklyMemoryChart";
import { WeeklyWaterChart } from "../caregiver/WeeklyWaterChart";
import { PrescriptionForm } from "./PrescriptionForm";
import { PerformanceReportPDF } from "./PerformanceReportPDF";

interface DoctorDashboardProps {
  doctor: Doctor;
  currentPatient: Patient;
  onSelectPatient: (patientId: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  currentPatient,
  onSelectPatient
}) => {
  const { t } = useLanguage();
  const allPatients = getPatients();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"performance" | "prescriptions" | "water">("performance");
  const [isReportPdfOpen, setIsReportPdfOpen] = useState(false);

  // Search filter over stored patients (strict real data search)
  const filteredPatients = allPatients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const domainStats = getDomainStats(currentPatient.id);
  const gameSessions = getGameSessions(currentPatient.id);
  const waterEvents = getWaterEvents(currentPatient.id);

  // Cognitive Domain scores
  const memoryDomain = domainStats.find((d) => d.domain === "Memory & Attention");
  const recallDomain = domainStats.find((d) => d.domain === "Recall");
  const patternDomain = domainStats.find((d) => d.domain === "Pattern Recognition");

  return (
    <div className="space-y-6">
      {/* Header & Patient Directory Search */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t("doctor.searchTitle")}</h1>
            <p className="text-slate-600 mt-0.5 text-xs sm:text-sm">
              Clinical longitudinal view for <strong>{doctor.name}</strong> • {doctor.specialty}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReportPdfOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>{t("doctor.generateReport")}</span>
          </button>
        </div>

        {/* Patient Search Input */}
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("doctor.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
          />
        </div>

        {/* Search Results / Patient Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-500">Matching Patients:</span>
          {filteredPatients.map((p) => {
            const isSelected = p.id === currentPatient.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPatient(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[11px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                  ({p.age} Y)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Patient Banner with Strict Data Isolation */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
            {currentPatient.name.charAt(0)}
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
              Selected Patient Profile
            </span>
            <h2 className="text-xl font-bold">{currentPatient.name}</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Age {currentPatient.age} • Region: {currentPatient.region} • Caregiver:{" "}
              {currentPatient.emergencyContact?.name}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("performance")}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === "performance" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {t("doctor.performance")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prescriptions")}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === "prescriptions" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            {t("doctor.newPrescription")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("water")}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === "water" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Hydration Log
          </button>
        </div>
      </div>

      {/* Tab: Performance */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* Key Domain Cards: Memory, Recall, Attention */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block">
                Memory Performance
              </span>
              <span className="text-3xl font-extrabold text-blue-900 mt-1 block">
                {memoryDomain ? `${memoryDomain.runningAvg}%` : t("doctor.noDataAvailable")}
              </span>
              <p className="text-xs text-slate-500 mt-1">Based on pair-match recall</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block">
                Recall & Cultural Recognition
              </span>
              <span className="text-3xl font-extrabold text-indigo-900 mt-1 block">
                {recallDomain ? `${recallDomain.runningAvg}%` : t("doctor.noDataAvailable")}
              </span>
              <p className="text-xs text-slate-500 mt-1">Autobiographical & cultural recall</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block">
                Pattern Recognition & Attention
              </span>
              <span className="text-3xl font-extrabold text-teal-900 mt-1 block">
                {patternDomain ? `${patternDomain.runningAvg}%` : t("doctor.noDataAvailable")}
              </span>
              <p className="text-xs text-slate-500 mt-1">Sequential rhythm and completion</p>
            </div>
          </div>

          {/* Memory Improvement Performance Module */}
          <MemoryImprovement patient={currentPatient} />

          {/* Two-Line Pattern Graph (Memory vs Activity Completion) */}
          <WeeklyMemoryChart patientId={currentPatient.id} />
        </div>
      )}

      {/* Tab: Prescriptions */}
      {activeTab === "prescriptions" && (
        <PrescriptionForm doctor={doctor} patient={currentPatient} />
      )}

      {/* Tab: Hydration Log */}
      {activeTab === "water" && <WeeklyWaterChart waterEvents={waterEvents} />}

      {/* Patient Performance Report PDF Modal */}
      <PerformanceReportPDF
        patient={currentPatient}
        doctor={doctor}
        isOpen={isReportPdfOpen}
        onClose={() => setIsReportPdfOpen(false)}
      />
    </div>
  );
};
