import React, { useState } from "react";
import {
  User as UserIcon,
  Heart,
  Stethoscope,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { Caretaker, Doctor, Patient, Role, User } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import {
  authenticateAccount,
  findRegisteredAccountByEmail,
  getAccessiblePatientsForUser,
  getOnboardingDraft,
  getPatientById,
  registerAccount,
  saveCaretaker,
  saveDoctor,
  setCurrentUser,
  setSelectedPatientId
} from "../../utils/storage";
import { PatientOnboardingWizard } from "../patient/PatientOnboardingWizard";

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
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When patient is in onboarding flow
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingIncompleteUser, setPendingIncompleteUser] = useState<User | undefined>(undefined);
  const [pendingIncompletePatient, setPendingIncompletePatient] = useState<Patient | undefined>(
    undefined
  );

  const existingDraft = getOnboardingDraft();

  // Demo Logins (preserved intact)
  const handleDemoLogin = (role: Role) => {
    setErrorMsg(null);
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

  const handleModeChange = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setErrorMsg(null);
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (mode === "login") {
      const result = authenticateAccount(cleanEmail, password, selectedRole);
      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }

      const loggedUser = result.user;

      if (loggedUser.role === "patient") {
        const patientRecord = loggedUser.patientId
          ? getPatientById(loggedUser.patientId)
          : undefined;
        if (patientRecord && patientRecord.onboardingCompleted === false) {
          setPendingIncompleteUser(loggedUser);
          setPendingIncompletePatient(patientRecord);
          setShowOnboarding(true);
          return;
        }
        if (loggedUser.patientId) {
          setSelectedPatientId(loggedUser.patientId);
        }
      } else {
        const accessible = getAccessiblePatientsForUser(loggedUser);
        const firstPid = accessible[0]?.id || "p1";
        setSelectedPatientId(firstPid);
      }

      setCurrentUser(loggedUser);
      onLoginSuccess(loggedUser);
      return;
    }

    // Sign up mode
    if (password.length < 6) {
      setErrorMsg("Please choose a password of at least 6 characters.");
      return;
    }

    if (findRegisteredAccountByEmail(cleanEmail, selectedRole)) {
      setErrorMsg("An account with this email and role already exists. Please sign in instead.");
      return;
    }

    if (selectedRole === "patient") {
      setPendingIncompleteUser(undefined);
      setPendingIncompletePatient(undefined);
      setShowOnboarding(true);
      return;
    }

    if (!cleanName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (selectedRole === "caretaker") {
      const caretakerId = `c-${Date.now()}`;
      const newCaretaker: Caretaker = {
        id: caretakerId,
        name: cleanName,
        email: cleanEmail.toLowerCase(),
        phone: phone.trim() || "+91 98000 00000",
        patientIds: ["p1"]
      };
      saveCaretaker(newCaretaker);

      const reg = registerAccount({
        name: cleanName,
        email: cleanEmail,
        password,
        role: "caretaker",
        caretakerId
      });

      if (!reg.ok) {
        setErrorMsg(reg.error);
        return;
      }

      const user: User = {
        id: reg.account.id,
        name: reg.account.name,
        email: reg.account.email,
        role: "caretaker",
        caretakerId,
        patientId: "p1"
      };
      setCurrentUser(user);
      setSelectedPatientId("p1");
      onLoginSuccess(user);
      return;
    }

    // Doctor signup
    const doctorId = `d-${Date.now()}`;
    const newDoctor: Doctor = {
      id: doctorId,
      name: cleanName,
      email: cleanEmail.toLowerCase(),
      phone: phone.trim() || "+91 98200 00000",
      specialty: specialty.trim() || "General & Geriatric Care",
      clinic: clinic.trim() || "RECALLED Partner Clinic",
      patientIds: ["p1"]
    };
    saveDoctor(newDoctor);

    const reg = registerAccount({
      name: cleanName,
      email: cleanEmail,
      password,
      role: "doctor",
      doctorId
    });

    if (!reg.ok) {
      setErrorMsg(reg.error);
      return;
    }

    const user: User = {
      id: reg.account.id,
      name: reg.account.name,
      email: reg.account.email,
      role: "doctor",
      doctorId,
      patientId: "p1"
    };
    setCurrentUser(user);
    setSelectedPatientId("p1");
    onLoginSuccess(user);
  };

  if (showOnboarding) {
    return (
      <PatientOnboardingWizard
        initialEmail={email.trim()}
        initialName={name.trim()}
        passwordForSignup={password}
        existingUser={pendingIncompleteUser}
        existingPatient={pendingIncompletePatient}
        onComplete={(user) => {
          setShowOnboarding(false);
          onLoginSuccess(user);
        }}
        onCancel={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar with Language Selector */}
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
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("auth.welcomeBack")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            {t("auth.subtitle")}
          </p>
        </div>

        {/* Login / Sign Up Mode Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => handleModeChange("login")}
            className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("auth.loginTab")}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("signup")}
            className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("auth.signupTab")}
          </button>
        </div>

        {/* Role Selector: EXACTLY THREE ROLES (Patient, Caretaker, Doctor) */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            {t("auth.selectRole")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Patient */}
            <button
              type="button"
              onClick={() => handleRoleChange("patient")}
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
              onClick={() => handleRoleChange("caretaker")}
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
              onClick={() => handleRoleChange("doctor")}
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

        {/* Resume draft banner if user previously paused patient onboarding */}
        {mode === "signup" && selectedRole === "patient" && existingDraft && (
          <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-blue-900">
              Saved onboarding draft found (Step {existingDraft.step} of 6)
            </span>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Resume
            </button>
          </div>
        )}

        {/* Inline Error Message */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("auth.name")} {selectedRole === "patient" ? "(optional here)" : "*"}
              </label>
              <input
                type="text"
                required={selectedRole !== "patient"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  selectedRole === "doctor"
                    ? "e.g. Dr. Sen"
                    : selectedRole === "caretaker"
                    ? "e.g. Priya Sharma"
                    : "e.g. Anand Sharma"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("auth.email")} *
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
              {t("auth.password")} *
            </label>
            <input
              type="password"
              required
              minLength={mode === "signup" ? 6 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.enterPassword")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {mode === "signup" && (selectedRole === "caretaker" || selectedRole === "doctor") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("auth.phone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {mode === "signup" && selectedRole === "doctor" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("auth.specialty")}
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Geriatric Care"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("auth.clinic")}
                </label>
                <input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="e.g. City Care Clinic"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>
              {mode === "login"
                ? t("auth.login")
                : selectedRole === "patient"
                ? t("auth.startOnboarding")
                : t("auth.signup")}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {mode === "signup" && (
            <p className="text-[11px] text-slate-500 text-center leading-snug pt-1">
              {t("auth.prototypeNotice")}
            </p>
          )}
        </form>

        {/* Demo Login Buttons (Instant access preserved) */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
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
      </div>

      {/* Non-diagnostic footer disclaimer */}
      <div className="w-full max-w-lg mx-auto text-center py-4">
        <p className="text-[11px] text-slate-400 font-medium">{t("app.disclaimer")}</p>
      </div>
    </div>
  );
};
