import React, { useState } from "react";
import { User as UserIcon, Heart, Stethoscope, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Role, User } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { setCurrentUser, setSelectedPatientId } from "../../utils/storage";

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Demo Logins
  const handleDemoLogin = (role: Role) => {
    let demoUser: User;

    if (role === "patient") {
      demoUser = {
        id: "u-patient-1",
        name: "Anand Sharma",
        email: "anand.sharma@example.com",
        role: "patient",
        patientId: "p1"
      };
      setSelectedPatientId("p1");
    } else if (role === "caretaker") {
      demoUser = {
        id: "u-caretaker-1",
        name: "Priya Sharma",
        email: "priya.sharma@care.org",
        role: "caretaker",
        caretakerId: "c1",
        patientId: "p1"
      };
      setSelectedPatientId("p1");
    } else {
      demoUser = {
        id: "u-doctor-1",
        name: "Dr. Arvind Mukherjee",
        email: "dr.mukherjee@cityneuro.org",
        role: "doctor",
        doctorId: "d1",
        patientId: "p1"
      };
      setSelectedPatientId("p1");
    }

    setCurrentUser(demoUser);
    onLoginSuccess(demoUser);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: `u-${Date.now()}`,
      name: name.trim() || (selectedRole === "patient" ? "Anand Sharma" : selectedRole === "caretaker" ? "Priya Sharma" : "Dr. Arvind Mukherjee"),
      email: email.trim() || `${selectedRole}@recalled.care`,
      role: selectedRole,
      patientId: "p1",
      caretakerId: selectedRole === "caretaker" ? "c1" : undefined,
      doctorId: selectedRole === "doctor" ? "d1" : undefined
    };

    setCurrentUser(user);
    setSelectedPatientId("p1");
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar with Language Selector (Available BEFORE login per §3) */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
            R
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-lg">RECALLED</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Choose Language:
          </span>
          <LanguageSelector variant="compact" />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("auth.welcomeBack")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            {t("auth.subtitle")}
          </p>
        </div>

        {/* Role Selector: EXACTLY THREE ROLES (Patient, Caretaker, Doctor) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            {t("auth.selectRole")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Patient */}
            <button
              type="button"
              onClick={() => setSelectedRole("patient")}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                selectedRole === "patient"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <UserIcon className="w-5 h-5 mb-1 text-blue-600" />
              <span className="text-xs">{t("role.patient")}</span>
            </button>

            {/* Caretaker */}
            <button
              type="button"
              onClick={() => setSelectedRole("caretaker")}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                selectedRole === "caretaker"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <Heart className="w-5 h-5 mb-1 text-indigo-600" />
              <span className="text-xs">{t("role.caretaker")}</span>
            </button>

            {/* Doctor */}
            <button
              type="button"
              onClick={() => setSelectedRole("doctor")}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                selectedRole === "doctor"
                  ? "border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-xs"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <Stethoscope className="w-5 h-5 mb-1 text-teal-600" />
              <span className="text-xs">{t("role.doctor")}</span>
            </button>
          </div>
        </div>

        {/* Demo Login Buttons (Instant access for evaluation) */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
            {t("auth.demoLogin")}
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleDemoLogin("patient")}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-800 border border-slate-200 text-xs font-semibold text-slate-700 text-left transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{t("auth.demoPatient")}</span>
              <span className="text-blue-600 font-bold">→</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("caretaker")}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-800 border border-slate-200 text-xs font-semibold text-slate-700 text-left transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{t("auth.demoCaretaker")}</span>
              <span className="text-indigo-600 font-bold">→</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("doctor")}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-50 hover:text-teal-800 border border-slate-200 text-xs font-semibold text-slate-700 text-left transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{t("auth.demoDoctor")}</span>
              <span className="text-teal-600 font-bold">→</span>
            </button>
          </div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("auth.name")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("auth.email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.enterEmail")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("auth.password")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.enterPassword")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer transition-colors"
          >
            {mode === "login" ? t("auth.login") : t("auth.signup")}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {mode === "login"
              ? "Don't have an account? Sign up here"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      {/* Non-diagnostic footer disclaimer */}
      <div className="w-full max-w-lg mx-auto text-center py-4">
        <p className="text-[11px] text-slate-400 font-medium">
          {t("app.disclaimer")}
        </p>
      </div>
    </div>
  );
};
