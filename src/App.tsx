import React, { useState, useEffect } from "react";
import { User, Patient, Doctor, Caretaker } from "./types";
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
  getPatients
} from "./utils/storage";

import { Layout } from "./components/common/Layout";
import { AuthPage } from "./components/common/AuthPage";
import { SettingsPage } from "./components/common/SettingsPage";
import { ProfilePage } from "./components/common/ProfilePage";

import { PatientDashboard } from "./components/patient/PatientDashboard";
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

  // Apply stored accessibility settings on startup
  useEffect(() => {
    const settings = getAccessibilitySettings();
    applyAccessibilityClasses(settings);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUserState(user);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    // Preserves language selection in localStorage key 'recalled-language'
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientIdState(patientId);
  };

  // Resolve current active patient record
  const currentPatient =
    getPatientById(selectedPatientId) || getPatients()[0] || {
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

  const currentDoctor: Doctor = {
    id: "d1",
    name: "Dr. Arvind Mukherjee",
    email: "dr.mukherjee@cityneuro.org",
    phone: "+91 98200 11223",
    specialty: "Consultant Neurologist & Geriatric Care",
    clinic: "Metropolitan Memory & Neurosciences Clinic, Kolkata",
    patientIds: ["p1", "p2", "p3"]
  };

  return (
    <LanguageProvider>
      <SpeechProvider>
        {!currentUser ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
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
                {activeTab === "games" && <GamesHub patientId={currentPatient.id} />}
                {activeTab === "memory-lane" && (
                  <MemoryLaneTimelinePage patient={currentPatient} />
                )}
                {activeTab === "progress" && <ProgressPage patient={currentPatient} />}
                {activeTab === "medicine" && <MedicinePage patient={currentPatient} />}
                {activeTab === "help" && <HelpSupportPage patient={currentPatient} />}
                {activeTab === "profile" && (
                  <ProfilePage user={currentUser} patient={currentPatient} />
                )}
                {activeTab === "settings" && <SettingsPage />}
              </>
            )}

            {currentUser.role === "caretaker" && (
              <>
                {activeTab === "dashboard" && (
                  <CaregiverDashboard
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
                  <ProfilePage user={currentUser} patient={currentPatient} />
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
