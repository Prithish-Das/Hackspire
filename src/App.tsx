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

import { Layout } from "./components/common/Layout";
import { AuthPage } from "./components/common/AuthPage";
import { SettingsPage } from "./components/common/SettingsPage";
import { ProfilePage } from "./components/common/ProfilePage";

import { PatientDashboard } from "./components/patient/PatientDashboard";
import { PatientOnboardingWizard } from "./components/patient/PatientOnboardingWizard";
import { MedicinePage } from "./components/patient/MedicinePage";
import { ProgressPage } from "./components/patient/ProgressPage";
import { MemoryLaneTimelinePage } from "./components/patient/MemoryLaneTimelinePage";
import { HelpSupportPage } from "./components/patient/HelpSupportPage";
import { GamesHub } from "./components/games/GamesHub";

import { CaregiverDashboard } from "./components/caregiver/CaregiverDashboard";
import { AlertsView } from "./components/caregiver/AlertsView";
import { MemoryAlbum } from "./components/caregiver/MemoryAlbum";
import { PrescriptionsView } from "./components/caregiver/PrescriptionsView";

import { DoctorDashboard } from "./components/doctor/DoctorDashboard";
import { PrescriptionForm } from "./components/doctor/PrescriptionForm";

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

  const handleDataRefresh = () => {
    setDataRevision((prev) => prev + 1);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUserState(user);
    if (user.role === "patient" && user.patientId) {
      setSelectedPatientId(user.patientId);
      setSelectedPatientIdState(user.patientId);
    } else {
      const accessible = getAccessiblePatientsForUser(user);
      const nextPid = accessible[0]?.id || "p1";
      setSelectedPatientId(nextPid);
      setSelectedPatientIdState(nextPid);
    }
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
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
      : accessiblePatients[0]?.id || "p1";

  const currentPatient: Patient =
    getPatientById(effectivePatientId) ||
    accessiblePatients[0] ||
    getPatients()[0] || {
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
    currentUser?.role === "patient" && currentPatient.onboardingCompleted === false;

  return (
    <LanguageProvider>
      <SpeechProvider>
        {!currentUser ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : needsOnboarding ? (
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
            patient={currentPatient}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onLogout={handleLogout}
          >
            {/* Role-Guarded View Rendering */}
            {currentUser.role === "patient" && (
              <>
                {activeTab === "dashboard" && (
                  <PatientDashboard
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
                {activeTab === "medicine" && <MedicinePage patient={currentPatient} />}
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
                    user={currentUser}
                    currentPatient={currentPatient}
                    onSelectPatient={handleSelectPatient}
                    onNavigateToTab={setActiveTab}
                  />
                )}
                {activeTab === "alerts" && <AlertsView patientId={currentPatient.id} />}
                {activeTab === "memory-album" && <MemoryAlbum patientId={currentPatient.id} />}
                {activeTab === "prescriptions" && (
                  <PrescriptionsView patientId={currentPatient.id} />
                )}
                {activeTab === "progress" && <ProgressPage patient={currentPatient} />}
                {activeTab === "profile" && (
                  <ProfilePage
                    user={currentUser}
                    patient={currentPatient}
                    onPatientUpdated={handleDataRefresh}
                  />
                )}
                {activeTab === "settings" && <SettingsPage />}
              </>
            )}

            {currentUser.role === "doctor" && (
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
