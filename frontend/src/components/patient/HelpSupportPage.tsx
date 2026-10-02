import React, { useState, useEffect } from "react";
import { Phone, AlertCircle, Heart, Wind, UserCheck, CheckCircle2 } from "lucide-react";
import { Patient } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { addAlert } from "../../utils/storage";
import { SpeakButton } from "../common/SpeakButton";

interface HelpSupportPageProps {
  patient: Patient;
}

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({ patient }) => {
  const { t } = useLanguage();
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const [alertSent, setAlertSent] = useState(false);

  // 4-4-4 Breathing Cycle
  useEffect(() => {
    if (!breathingActive) return;

    let phaseTimer: NodeJS.Timeout;
    const cycle = () => {
      setBreathPhase("in");
      phaseTimer = setTimeout(() => {
        setBreathPhase("hold");
        phaseTimer = setTimeout(() => {
          setBreathPhase("out");
          phaseTimer = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };

    cycle();

    return () => clearTimeout(phaseTimer);
  }, [breathingActive]);

  const handleSendUrgentHelp = () => {
    addAlert({
      id: `alt-${Date.now()}`,
      patientId: patient.id,
      type: "general",
      severity: "warning",
      message: `${patient.name} pressed 'I Need Assistance' at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      timestamp: new Date().toISOString(),
      resolved: false
    });
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 5000);
  };

  const emergencyPhone = patient.emergencyContact?.phone || "+91 98765 43210";
  const emergencyName = patient.emergencyContact?.name || "Priya Sharma (Daughter)";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{t("help.title")}</h1>
            <SpeakButton text={`${t("help.title")}. ${t("help.subtitle")}`} id="help-page-speak" size="sm" />
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">{t("help.subtitle")}</p>
        </div>
      </div>

      {alertSent && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">
            Help notification sent to your caregiver ({emergencyName}). They have been alerted to
            assist you.
          </span>
        </div>
      )}

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. I Need Immediate Help */}
        <div className="bg-white p-6 rounded-2xl border-2 border-rose-200 hover:border-rose-400 transition-all shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t("help.iNeedHelp")}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Press this button to immediately notify your primary caregiver that you need
              assistance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendUrgentHelp}
            className="w-full mt-6 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer transition-transform"
          >
            {t("help.iNeedHelp")}
          </button>
        </div>

        {/* 2. Call Caregiver */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t("help.callCaregiver")}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Connect directly with {emergencyName}.
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-2">{emergencyPhone}</p>
          </div>

          <a
            href={`tel:${emergencyPhone}`}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer transition-transform"
          >
            <Phone className="w-4 h-4" />
            {t("help.callCaregiver")}
          </a>
        </div>

        {/* 3. Emergency Contact */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Phone className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t("help.emergencyContact")}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              National Emergency Helpline (India)
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-2">Dial 112 (Emergency Services)</p>
          </div>

          <a
            href="tel:112"
            className="w-full mt-6 inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer transition-transform"
          >
            <Phone className="w-4 h-4" />
            Dial 112
          </a>
        </div>
      </div>

      {/* Reassurance & Calm Breathing Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
              <Heart className="w-4 h-4 text-teal-600 fill-teal-600" />
              <span>{t("help.feelingLow")}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t("help.calmBreathing")}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Take a quiet moment for yourself. Following a gentle 4-second breathing pace calms the
              nervous system, reduces tension, and restores peace of mind.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setBreathingActive(!breathingActive)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer ${
                  breathingActive
                    ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                <Wind className="w-4 h-4" />
                {breathingActive ? "Stop Breathing Exercise" : "Start Calm Breathing"}
              </button>
            </div>
          </div>

          {/* Interactive Breathing Visualizer */}
          <div className="w-56 h-56 flex flex-col items-center justify-center relative">
            <div
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-1000 border-4 ${
                !breathingActive
                  ? "bg-slate-100 border-slate-200 scale-95"
                  : breathPhase === "in"
                  ? "bg-teal-100 border-teal-400 scale-110 shadow-lg"
                  : breathPhase === "hold"
                  ? "bg-indigo-100 border-indigo-400 scale-105"
                  : "bg-sky-100 border-sky-400 scale-90"
              }`}
            >
              <Wind className="w-8 h-8 text-teal-700 mb-2" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 text-center px-2">
                {!breathingActive
                  ? "Gentle Rest"
                  : breathPhase === "in"
                  ? t("help.breatheIn")
                  : breathPhase === "hold"
                  ? t("help.hold")
                  : t("help.breatheOut")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
