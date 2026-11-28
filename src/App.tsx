import React, { useState, useEffect } from "react";
import { User, Patient, Doctor } from "./types";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SpeechProvider } from "./contexts/SpeechContext";
import {
  getCurrentUser,
  setCurrentUser,
  getPatientById,
  getSelectedPatientId,
  setSelectedPatientId,
  getAccessibilitySettings,
  applyAccessibilityClasses,
  getPatients,
  getDoctors,
  getAccessiblePatientsForUser
} from "./utils/storage";
import { syncPatientToBackend } from "./services/gameApi";
import { clearBackendAuthToken, ensureBackendSession } from "./services/connectionApi";

import { Layout } from "./components/common/Layout";
import { AuthPage } from "./components/common/AuthPage";
import { SettingsPage } from "./components/common/SettingsPage";
import { ProfilePage } from "./components/common/ProfilePage";

import { PatientDashboard } from "./components/patient/PatientDashboard";
import { PatientOnboardingWizard } from "./components/patient/PatientOnboardingWizard";
import { MedicinePage } from "./components/patient/MedicinePage";
import { MyCaregiversPage } from "./components/patient/MyCaregiversPage";
import { ProgressPage } from "./components/patient/ProgressPage";
import { MemoryLaneTimelinePage } from "./components/patient/MemoryLaneTimelinePage";
import { HelpSupportPage } from "./components/patient/HelpSupportPage";
import { GamesHub } from "./components/games/GamesHub";

import { CaregiverDashboard } from "./components/caregiver/CaregiverDashboard";
import { MyPatientsPage } from "./components/caregiver/MyPatientsPage";
import { CaregiverRemindersPage } from "./components/caregiver/CaregiverRemindersPage";
import { AlertsView } from "./components/caregiver/AlertsView";
import { MemoryAlbum } from "./components/caregiver/MemoryAlbum";
import { PrescriptionsView } from "./components/caregiver/PrescriptionsView";

import { DoctorDashboard } from "./components/doctor/DoctorDashboard";
import { PrescriptionForm } from "./components/doctor/PrescriptionForm";
import { Users, UserPlus } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => getCurrentUser());
  const [selectedPatientId, setSelectedPatientIdState] = useState<string>(() =>
    getSelectedPatientId()
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, setDataRevision] = useState(0);

  // Apply stored accessibility settings on startup
  useEffect(() => {
    const settings = getAccessibilitySettings();
    applyAccessibilityClasses(settings);
  }, []);

  // Ensure in-memory backend bearer token is initialized for the active user
  useEffect(() => {
    void ensureBackendSession(currentUser);
  }, [currentUser?.id, currentUser?.role]);

  const handleDataRefresh = () => {
    setDataRevision((prev) => prev + 1);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUserState(user);
    if (user.role === "patient" && user.patientId) {
      setSelectedPatientId(user.patientId);
      setSelectedPatientIdState(user.patientId);
    } else if (user.role === "caretaker") {
      const accessible = getAccessiblePatientsForUser(user);
      const nextPid = accessible[0]?.id || "";
      setSelectedPatientId(nextPid);
      setSelectedPatientIdState(nextPid);
    } else {
      const accessible = getAccessiblePatientsForUser(user);
      const nextPid = accessible[0]?.id || "p1";
      setSelectedPatientId(nextPid);
      setSelectedPatientIdState(nextPid);
    }
    setActiveTab("dashboard");
    handleDataRefresh();
  };

  const handleLogout = () => {
    clearBackendAuthToken();
    setCurrentUser(null);
    setCurrentUserState(null);
  };

  const handleSelectPatient = (patientId: string) => {
    if (currentUser?.role === "patient") return;
    const accessible = getAccessiblePatientsForUser(currentUser);
    if (!accessible.some((p) => p.id === patientId)) return;
    setSelectedPatientId(patientId);
    setSelectedPatientIdState(patientId);
  };

  // Enforce strict role-based patient scoping
  const accessiblePatients = getAccessiblePatientsForUser(currentUser);
  const effectivePatientId =
    currentUser?.role === "patient"
      ? currentUser.patientId || "p1"
      : accessiblePatients.some((p) => p.id === selectedPatientId)
      ? selectedPatientId
      : accessiblePatients[0]?.id || (currentUser?.role === "caretaker" ? "" : "p1");

  const fallbackPatient: Patient = {
    id: "p1",
    name: "Anand Sharma",
    age: 74,
    birthYear: 1952,
    region: "Northern & Eastern India",
    language: "en",
    interests: ["Cinema", "Music", "Cricket"],
    caretakerId: "c1",
    doctorIds: ["d1"]
  };

  const currentPatient: Patient | null =
    currentUser?.role === "caretaker"
      ? accessiblePatients.length === 0
        ? null
        : getPatientById(effectivePatientId) || accessiblePatients[0] || null
      : getPatientById(effectivePatientId) ||
        accessiblePatients[0] ||
        getPatients()[0] ||
        fallbackPatient;

  // Sync active non-sensitive patient shell to backend slice
  useEffect(() => {
    if (currentPatient?.id) {
      void syncPatientToBackend(currentPatient);
    }
  }, [currentPatient?.id, currentPatient?.name, currentPatient?.age, currentPatient?.language]);

  const storedDoctors = getDoctors();
  const currentDoctor: Doctor =
    storedDoctors.find((d) => d.id === currentUser?.doctorId) ||
    storedDoctors[0] || {
      id: "d1",
      name: "Dr. Arvind Mukherjee",
      email: "dr.mukherjee@cityneuro.org",
      phone: "+91 98200 11223",
      specialty: "Consultant Neurologist & Geriatric Care",
      clinic: "Metropolitan Memory & Neurosciences Clinic, Kolkata",
      patientIds: ["p1", "p2", "p3"]
    };

  const needsOnboarding =
    currentUser?.role === "patient" &&
    Boolean(currentPatient && currentPatient.onboardingCompleted === false);

  const renderCaregiverEmptyPrompt = () => (
    <div className="max-w-xl mx-auto mt-8 bg-white rounded-3xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
        <Users className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900">No Connected Patients Yet</h2>
      <p className="text-sm text-slate-600">
        Connect with a patient account using their User ID or invitation code before viewing
        isolated patient alerts, reminders, or progress.
      </p>
      <button
        type="button"
        onClick={() => setActiveTab("patients")}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Connect a Patient</span>
      </button>
    </div>
  );

  return (
    <LanguageProvider>
      <SpeechProvider>
        {!currentUser ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : needsOnboarding && currentPatient ? (
          <PatientOnboardingWizard
            existingUser={currentUser}
            existingPatient={currentPatient}
            onComplete={(updatedUser, updatedPatient) => {
              setCurrentUserState(updatedUser);
              setSelectedPatientIdState(updatedPatient.id);
              handleDataRefresh();
            }}
            onCancel={handleLogout}
          />
        ) : (
          <Layout
            user={currentUser}
            patient={currentPatient || undefined}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onLogout={handleLogout}
          >
            {/* Role-Guarded View Rendering */}
            {currentUser.role === "patient" && currentPatient && (
              <>
                {activeTab === "dashboard" && (
                  <PatientDashboard
                    user={currentUser}
                    patient={currentPatient}
                    onNavigateToGames={() => setActiveTab("games")}
                    onNavigateToMemoryLane={() => setActiveTab("memory-lane")}
                    onNavigateToMedicine={() => setActiveTab("medicine")}
                  />
                )}
                {activeTab === "games" && (
                  <GamesHub
                    patientId={currentPatient.id}
                    onPatientUpdated={handleDataRefresh}
                  />
                )}
                {activeTab === "memory-lane" && (
                  <MemoryLaneTimelinePage
                    patient={currentPatient}
                    onPatientUpdated={handleDataRefresh}
                  />
                )}
                {activeTab === "progress" && <ProgressPage patient={currentPatient} />}
                {activeTab === "medicine" && (
                  <MedicinePage user={currentUser} patient={currentPatient} />
                )}
                {activeTab === "caregivers" && (
                  <MyCaregiversPage
                    user={currentUser}
                    patient={currentPatient}
                    onConnectionsChanged={handleDataRefresh}
                  />
                )}
                {activeTab === "help" && <HelpSupportPage patient={currentPatient} />}
                {activeTab === "profile" && (
                  <ProfilePage
                    user={currentUser}
                    patient={currentPatient}
                    onPatientUpdated={(updated) => {
                      setCurrentUserState((prev) =>
                        prev ? { ...prev, name: updated.name } : prev
                      );
                      handleDataRefresh();
                    }}
                  />
                )}
                {activeTab === "settings" && <SettingsPage />}
              </>
            )}

            {currentUser.role === "caretaker" && (
              <>
                {activeTab === "dashboard" && (
                  <CaregiverDashboard
                    key={currentPatient?.id || "caregiver-empty"}
                    user={currentUser}
                    currentPatient={currentPatient}
                    onSelectPatient={handleSelectPatient}
                    onNavigateToTab={setActiveTab}
                  />
                )}
                {activeTab === "patients" && (
                  <MyPatientsPage
                    user={currentUser}
                    selectedPatientId={currentPatient?.id || ""}
                    onSelectPatient={handleSelectPatient}
                    onNavigateToTab={setActiveTab}
                    onConnectionsChanged={handleDataRefresh}
                  />
                )}
                {activeTab === "reminders" && (
                  <CaregiverRemindersPage
                    key={currentPatient?.id || "reminders-empty"}
                    user={currentUser}
                    currentPatient={currentPatient}
                    onSelectPatient={handleSelectPatient}
                    onNavigateToTab={setActiveTab}
                  />
                )}
                {activeTab === "alerts" &&
                  (currentPatient ? (
                    <AlertsView key={currentPatient.id} patientId={currentPatient.id} />
                  ) : (
                    renderCaregiverEmptyPrompt()
                  ))}
                {activeTab === "memory-album" &&
                  (currentPatient ? (
                    <MemoryAlbum key={currentPatient.id} patientId={currentPatient.id} />
                  ) : (
                    renderCaregiverEmptyPrompt()
                  ))}
                {activeTab === "prescriptions" &&
                  (currentPatient ? (
                    <PrescriptionsView key={currentPatient.id} patientId={currentPatient.id} />
                  ) : (
                    renderCaregiverEmptyPrompt()
                  ))}
                {activeTab === "progress" &&
                  (currentPatient ? (
                    <ProgressPage key={currentPatient.id} patient={currentPatient} />
                  ) : (
                    renderCaregiverEmptyPrompt()
                  ))}
                {activeTab === "profile" &&
                  (currentPatient ? (
                    <ProfilePage
                      key={currentPatient.id}
                      user={currentUser}
                      patient={currentPatient}
                      onPatientUpdated={handleDataRefresh}
                    />
                  ) : (
                    <div className="max-w-xl mx-auto mt-6 space-y-4">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                          Caregiver Account
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
                        <p className="text-sm text-slate-600">{currentUser.email}</p>
                        <p className="text-xs font-mono text-slate-500 pt-1">
                          User ID: {currentUser.id}
                          {currentUser.inviteCode ? ` • Invite Code: ${currentUser.inviteCode}` : ""}
                        </p>
                      </div>
                      {renderCaregiverEmptyPrompt()}
                    </div>
                  ))}
                {activeTab === "settings" && <SettingsPage />}
              </>
            )}

            {currentUser.role === "doctor" && currentPatient && (
              <>
                {activeTab === "dashboard" && (
                  <DoctorDashboard
                    doctor={currentDoctor}
                    currentPatient={currentPatient}
                    onSelectPatient={handleSelectPatient}
                  />
                )}
                {activeTab === "performance" && (
                  <DoctorDashboard
                    doctor={currentDoctor}
                    currentPatient={currentPatient}
                    onSelectPatient={handleSelectPatient}
                  />
                )}
                {activeTab === "prescriptions" && (
                  <div className="space-y-6">
                    <PrescriptionForm doctor={currentDoctor} patient={currentPatient} />
                  </div>
                )}
                {activeTab === "profile" && <ProfilePage user={currentUser} />}
                {activeTab === "settings" && <SettingsPage />}
              </>
            )}
          </Layout>
        )}
      </SpeechProvider>
    </LanguageProvider>
  );
}
