import React, { useState, useEffect } from "react";
import {
  Check,
  FileText,
  Heart,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";
import {
  Doctor,
  FamilyMemberEntry,
  Language,
  Patient,
  PatientDislikes,
  PatientFamilyInfo,
  PatientInterests,
  PatientMedicalInfo,
  User as UserType
} from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  canUserAccessPatient,
  getDoctors,
  saveDoctor,
  updatePatient
} from "../../utils/storage";
import {
  INTEREST_OPTIONS,
  UNCOMFORTABLE_TOPIC_SUGGESTIONS
} from "../../utils/contentFilter";
import { syncPatientToBackend } from "../../services/gameApi";

interface ProfilePageProps {
  user: UserType;
  patient?: Patient;
  onPatientUpdated?: (patient: Patient) => void;
}

function createEmptyDislikes(): PatientDislikes {
  return {
    dislikedSportsOrTeams: [],
    dislikedEntertainment: [],
    uncomfortableTopics: [],
    excludedPeopleOrSubjects: [],
    otherExclusions: []
  };
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  patient,
  onPatientUpdated
}) => {
  const { t, setLanguage } = useLanguage();

  const isPatientContext = Boolean(patient);
  const hasAccess = isPatientContext
    ? canUserAccessPatient(user, patient!.id)
    : true;

  // Doctor own profile state (when no patient context)
  const existingDoctor = !isPatientContext
    ? getDoctors().find((d) => d.id === user.doctorId) || getDoctors()[0]
    : undefined;

  const [docName, setDocName] = useState(existingDoctor?.name || user.name);
  const [docPhone, setDocPhone] = useState(existingDoctor?.phone || "");
  const [docSpecialty, setDocSpecialty] = useState(existingDoctor?.specialty || "");
  const [docClinic, setDocClinic] = useState(existingDoctor?.clinic || "");

  // Patient personalisation state
  const [name, setName] = useState(patient?.name || user.name);
  const [age, setAge] = useState(patient?.age ? String(patient.age) : "70");
  const [city, setCity] = useState(patient?.city || "");
  const [stateName, setStateName] = useState(patient?.state || "");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(
    patient?.language || "en"
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    patient?.emergencyContact?.phone || "+91 98765 43210"
  );
  const [emergencyName, setEmergencyName] = useState(
    patient?.emergencyContact?.name || "Priya Sharma (Daughter)"
  );

  const [medicalInfo, setMedicalInfo] = useState<PatientMedicalInfo>(
    patient?.medicalInfo || {
      voluntaryConsentGiven: false,
      hasPriorAssessment: "skipped"
    }
  );
  const [familyInfo, setFamilyInfo] = useState<PatientFamilyInfo>(
    patient?.familyInfo || {
      assistedByCaregiver: false,
      allowInGames: true,
      spouse: { name: "", relationDetail: "" },
      children: [],
      grandchildren: []
    }
  );
  const [structuredInterests, setStructuredInterests] = useState<PatientInterests>(
    patient?.structuredInterests || {
      sports: [],
      entertainment: [],
      lifestyle: [],
      custom: []
    }
  );
  const [customInterestInput, setCustomInterestInput] = useState("");
  const [dislikes, setDislikes] = useState<PatientDislikes>(
    patient?.dislikes || createEmptyDislikes()
  );
  const [dislikeInputs, setDislikeInputs] = useState<Record<keyof PatientDislikes, string>>({
    dislikedSportsOrTeams: "",
    dislikedEntertainment: "",
    uncomfortableTopics: "",
    excludedPeopleOrSubjects: "",
    otherExclusions: ""
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync form when selected patient changes
  useEffect(() => {
    if (!patient) return;
    setName(patient.name || "");
    setAge(patient.age ? String(patient.age) : "70");
    setCity(patient.city || "");
    setStateName(patient.state || "");
    setPreferredLanguage(patient.language || "en");
    setEmergencyName(patient.emergencyContact?.name || "");
    setEmergencyPhone(patient.emergencyContact?.phone || "");
    setMedicalInfo(
      patient.medicalInfo || {
        voluntaryConsentGiven: false,
        hasPriorAssessment: "skipped"
      }
    );
    setFamilyInfo(
      patient.familyInfo || {
        assistedByCaregiver: false,
        allowInGames: true,
        spouse: { name: "", relationDetail: "" },
        children: [],
        grandchildren: []
      }
    );
    setStructuredInterests(
      patient.structuredInterests || {
        sports: [],
        entertainment: [],
        lifestyle: [],
        custom: []
      }
    );
    setDislikes(patient.dislikes || createEmptyDislikes());
  }, [patient?.id, patient?.updatedAt]);

  if (isPatientContext && !hasAccess) {
    return (
      <div className="max-w-2xl bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 flex items-start gap-3 text-rose-900">
        <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-lg">Access Restricted</h2>
          <p className="text-sm mt-1">{t("profile.accessRestricted")}</p>
        </div>
      </div>
    );
  }

  // Doctor profile save handler
  const handleDoctorSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingDoctor) return;
    const updatedDoc: Doctor = {
      ...existingDoctor,
      name: docName.trim() || existingDoctor.name,
      phone: docPhone.trim(),
      specialty: docSpecialty.trim(),
      clinic: docClinic.trim()
    };
    saveDoctor(updatedDoc);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  if (!patient) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-blue-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {docName.charAt(0)}
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-teal-100 text-teal-800">
              Role: {user.role}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{docName}</h1>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        {savedNotice && (
          <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile changes saved successfully.</span>
          </div>
        )}

        <form
          onSubmit={handleDoctorSave}
          className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Clinician Profile
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={docPhone}
              onChange={(e) => setDocPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("auth.specialty")}
              </label>
              <input
                type="text"
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("auth.clinic")}
              </label>
              <input
                type="text"
                value={docClinic}
                onChange={(e) => setDocClinic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t("common.save")}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Family helpers
  const addChild = () => {
    const entry: FamilyMemberEntry = {
      id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      relationDetail: ""
    };
    setFamilyInfo((prev) => ({ ...prev, children: [...prev.children, entry] }));
  };

  const addGrandchild = () => {
    const entry: FamilyMemberEntry = {
      id: `gchild-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      relationDetail: ""
    };
    setFamilyInfo((prev) => ({ ...prev, grandchildren: [...prev.grandchildren, entry] }));
  };

  // Interest helpers
  const toggleInterest = (category: "sports" | "entertainment" | "lifestyle", item: string) => {
    setStructuredInterests((prev) => {
      const curr = prev[category] || [];
      return {
        ...prev,
        [category]: curr.includes(item) ? curr.filter((x) => x !== item) : [...curr, item]
      };
    });
  };

  const addCustomInterest = () => {
    const clean = customInterestInput.trim();
    if (!clean) return;
    setStructuredInterests((prev) => {
      if (prev.custom.some((x) => x.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, custom: [...prev.custom, clean] };
    });
    setCustomInterestInput("");
  };

  // Dislike helpers
  const toggleDislikeTerm = (bucket: keyof PatientDislikes, term: string) => {
    setDislikes((prev) => {
      const list = prev[bucket] || [];
      const exists = list.some((x) => x.toLowerCase() === term.toLowerCase());
      return {
        ...prev,
        [bucket]: exists
          ? list.filter((x) => x.toLowerCase() !== term.toLowerCase())
          : [...list, term]
      };
    });
  };

  const addDislikeTerm = (bucket: keyof PatientDislikes) => {
    const clean = (dislikeInputs[bucket] || "").trim();
    if (!clean) return;
    setDislikes((prev) => {
      const list = prev[bucket] || [];
      if (list.some((x) => x.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, [bucket]: [...list, clean] };
    });
    setDislikeInputs((prev) => ({ ...prev, [bucket]: "" }));
  };

  // Prescription metadata upload
  const handlePrescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedicalInfo((prev) => ({
      ...prev,
      prescription: {
        ...(prev.prescription || { hasPrescription: true }),
        hasPrescription: true,
        attachmentMeta: {
          fileName: file.name,
          fileType: file.type || "unknown",
          fileSizeBytes: file.size,
          recordedAt: new Date().toISOString(),
          storedInBrowser: false
        }
      }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAge = parseInt(age, 10);
    if (Number.isNaN(numericAge) || numericAge < 1 || numericAge > 120) {
      setErrorMsg("Please enter a valid age between 1 and 120.");
      return;
    }

    const cleanName = name.trim() || patient.name;
    const cleanCity = city.trim();
    const cleanState = stateName.trim();
    const regionLabel = [cleanCity, cleanState].filter(Boolean).join(", ") || patient.region;

    const flatInterests = Array.from(
      new Set([
        ...structuredInterests.sports,
        ...structuredInterests.entertainment,
        ...structuredInterests.lifestyle,
        ...structuredInterests.custom
      ])
    );

    const updated: Patient = {
      ...patient,
      name: cleanName,
      age: numericAge,
      birthYear: new Date().getFullYear() - numericAge,
      city: cleanCity,
      state: cleanState,
      region: regionLabel,
      language: preferredLanguage,
      interests: flatInterests,
      onboardingCompleted: true,
      basicInfo: {
        fullName: cleanName,
        age: numericAge,
        city: cleanCity,
        state: cleanState,
        preferredLanguage
      },
      medicalInfo,
      familyInfo: {
        ...familyInfo,
        spouse: familyInfo.spouse?.name?.trim()
          ? {
              name: familyInfo.spouse.name.trim(),
              relationDetail: familyInfo.spouse.relationDetail?.trim()
            }
          : undefined,
        children: familyInfo.children.filter((c) => c.name.trim()),
        grandchildren: familyInfo.grandchildren.filter((g) => g.name.trim())
      },
      structuredInterests,
      dislikes,
      emergencyContact: {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relation: patient.emergencyContact?.relation || "Primary Contact"
      }
    };

    updatePatient(updated);
    if (user.role === "patient") {
      setLanguage(preferredLanguage);
    }
    void syncPatientToBackend(updated);
    onPatientUpdated?.(updated);

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
          {name.charAt(0)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
              Role: {user.role}
            </span>
            {user.role === "caretaker" && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                Editing Patient: {patient.name}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{name}</h1>
          <p className="text-xs text-slate-500">
            {t("profile.editPreferences")} • {user.email}
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile and personalisation preferences saved. Content filters updated immediately.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 text-rose-900 border border-rose-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Basic Information */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            {t("profile.basicInfo")}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("onboarding.step1.fullName")} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step1.age")} *
              </label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step1.city")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step1.state")}
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("onboarding.step1.language")}
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as Language)}
              className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Caregiver / Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Emergency Phone
              </label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Medical Background (Voluntary) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>{t("profile.medicalInfo")}</span>
          </h2>
          <p className="text-xs text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
            {t("onboarding.step2.nonDiagnostic")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prior Memory / Dementia Assessment
              </label>
              <select
                value={medicalInfo.hasPriorAssessment}
                onChange={(e) =>
                  setMedicalInfo((prev) => ({
                    ...prev,
                    hasPriorAssessment: e.target.value as PatientMedicalInfo["hasPriorAssessment"]
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              >
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
                <option value="prefer_not_to_say">{t("onboarding.step2.preferNot")}</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step2.assessmentDetails")}
              </label>
              <input
                type="text"
                value={medicalInfo.assessmentDetails || ""}
                onChange={(e) =>
                  setMedicalInfo((prev) => ({ ...prev, assessmentDetails: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step2.doctorName")}
              </label>
              <input
                type="text"
                value={medicalInfo.prescription?.doctorName || ""}
                onChange={(e) =>
                  setMedicalInfo((prev) => ({
                    ...prev,
                    prescription: {
                      ...(prev.prescription || { hasPrescription: true }),
                      hasPrescription: true,
                      doctorName: e.target.value
                    }
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step2.prescriptionDate")}
              </label>
              <input
                type="date"
                value={medicalInfo.prescription?.prescriptionDate || ""}
                onChange={(e) =>
                  setMedicalInfo((prev) => ({
                    ...prev,
                    prescription: {
                      ...(prev.prescription || { hasPrescription: true }),
                      hasPrescription: true,
                      prescriptionDate: e.target.value
                    }
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("onboarding.step2.manualNotes")}
            </label>
            <textarea
              rows={2}
              value={medicalInfo.prescription?.manualNotes || ""}
              onChange={(e) =>
                setMedicalInfo((prev) => ({
                  ...prev,
                  prescription: {
                    ...(prev.prescription || { hasPrescription: true }),
                    hasPrescription: true,
                    manualNotes: e.target.value
                  }
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-700">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Attach Prescription Metadata</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handlePrescriptionFileChange}
                className="sr-only"
              />
            </label>
            {medicalInfo.prescription?.attachmentMeta && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <FileText className="w-3.5 h-3.5" />
                {medicalInfo.prescription.attachmentMeta.fileName} (metadata only)
              </span>
            )}
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={medicalInfo.voluntaryConsentGiven}
              onChange={(e) =>
                setMedicalInfo((prev) => ({ ...prev, voluntaryConsentGiven: e.target.checked }))
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <span>{t("onboarding.step2.consentLabel")}</span>
          </label>
        </div>

        {/* 3. Family Relationships */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{t("profile.familyInfo")}</span>
          </h2>

          <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-950 bg-blue-50 p-3 rounded-xl border border-blue-200 cursor-pointer">
            <input
              type="checkbox"
              checked={familyInfo.allowInGames !== false}
              onChange={(e) =>
                setFamilyInfo((prev) => ({ ...prev, allowInGames: e.target.checked }))
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <span>{t("onboarding.step3.allowInGames")}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step3.spouse")}
              </label>
              <input
                type="text"
                value={familyInfo.spouse?.name || ""}
                onChange={(e) =>
                  setFamilyInfo((prev) => ({
                    ...prev,
                    spouse: { ...(prev.spouse || { name: "" }), name: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("onboarding.step3.relationDetail")}
              </label>
              <input
                type="text"
                value={familyInfo.spouse?.relationDetail || ""}
                onChange={(e) =>
                  setFamilyInfo((prev) => ({
                    ...prev,
                    spouse: { ...(prev.spouse || { name: "" }), relationDetail: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Children */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">{t("onboarding.step3.children")}</span>
              <button
                type="button"
                onClick={addChild}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("onboarding.step3.addChild")}
              </button>
            </div>
            {familyInfo.children.map((child) => (
              <div key={child.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      children: prev.children.map((c) =>
                        c.id === child.id ? { ...c, name: e.target.value } : c
                      )
                    }))
                  }
                  placeholder="Name"
                  className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  value={child.relationDetail || ""}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      children: prev.children.map((c) =>
                        c.id === child.id ? { ...c, relationDetail: e.target.value } : c
                      )
                    }))
                  }
                  placeholder="Relationship detail"
                  className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      children: prev.children.filter((c) => c.id !== child.id)
                    }))
                  }
                  className="sm:col-span-1 p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Grandchildren */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {t("onboarding.step3.grandchildren")}
              </span>
              <button
                type="button"
                onClick={addGrandchild}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("onboarding.step3.addGrandchild")}
              </button>
            </div>
            {familyInfo.grandchildren.map((gc) => (
              <div key={gc.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={gc.name}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      grandchildren: prev.grandchildren.map((g) =>
                        g.id === gc.id ? { ...g, name: e.target.value } : g
                      )
                    }))
                  }
                  placeholder="Name"
                  className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  value={gc.relationDetail || ""}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      grandchildren: prev.grandchildren.map((g) =>
                        g.id === gc.id ? { ...g, relationDetail: e.target.value } : g
                      )
                    }))
                  }
                  placeholder="Relationship detail"
                  className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      grandchildren: prev.grandchildren.filter((g) => g.id !== gc.id)
                    }))
                  }
                  className="sm:col-span-1 p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Interests & Preferences */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t("profile.interestsInfo")}</span>
          </h2>

          {(
            [
              { key: "sports" as const, label: t("onboarding.step4.sports"), list: INTEREST_OPTIONS.sports },
              {
                key: "entertainment" as const,
                label: t("onboarding.step4.entertainment"),
                list: INTEREST_OPTIONS.entertainment
              },
              {
                key: "lifestyle" as const,
                label: t("onboarding.step4.lifestyle"),
                list: INTEREST_OPTIONS.lifestyle
              }
            ] as const
          ).map((group) => (
            <div key={group.key} className="space-y-1.5">
              <span className="text-xs font-bold text-slate-600 block">{group.label}</span>
              <div className="flex flex-wrap gap-2">
                {group.list.map((item) => {
                  const active = structuredInterests[group.key].includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(group.key, item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={customInterestInput}
              onChange={(e) => setCustomInterestInput(e.target.value)}
              placeholder={t("onboarding.step4.customPlaceholder")}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="button"
              onClick={addCustomInterest}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              {t("common.add")}
            </button>
          </div>
          {structuredInterests.custom.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {structuredInterests.custom.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() =>
                      setStructuredInterests((prev) => ({
                        ...prev,
                        custom: prev.custom.filter((x) => x !== item)
                      }))
                    }
                    className="text-blue-700 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5. Dislikes & Content Exclusions */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-rose-950 pb-2 border-b border-rose-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>{t("profile.dislikesInfo")}</span>
          </h2>
          <p className="text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-200">
            {t("onboarding.step5.strongRuleNotice")}
          </p>

          {(
            [
              {
                bucket: "dislikedSportsOrTeams" as keyof PatientDislikes,
                label: t("onboarding.step5.dislikedSports"),
                suggestions: ["Cricket", "Football", "Tennis", "Hockey"]
              },
              {
                bucket: "dislikedEntertainment" as keyof PatientDislikes,
                label: t("onboarding.step5.dislikedEntertainment"),
                suggestions: ["Television", "Movies", "Cartoons", "Loud music"]
              },
              {
                bucket: "uncomfortableTopics" as keyof PatientDislikes,
                label: t("onboarding.step5.uncomfortableTopics"),
                suggestions: [...UNCOMFORTABLE_TOPIC_SUGGESTIONS]
              },
              {
                bucket: "excludedPeopleOrSubjects" as keyof PatientDislikes,
                label: t("onboarding.step5.excludedPeople"),
                suggestions: []
              },
              {
                bucket: "otherExclusions" as keyof PatientDislikes,
                label: t("onboarding.step5.otherExclusions"),
                suggestions: []
              }
            ] as const
          ).map((section) => {
            const list = dislikes[section.bucket];
            return (
              <div key={section.bucket} className="space-y-2 pt-2 border-t border-slate-100 first:border-t-0">
                <span className="text-xs font-bold text-slate-800 block">{section.label}</span>
                {section.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {section.suggestions.map((sug) => {
                      const active = list.some((x) => x.toLowerCase() === sug.toLowerCase());
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => toggleDislikeTerm(section.bucket, sug)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                            active
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {sug}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dislikeInputs[section.bucket]}
                    onChange={(e) =>
                      setDislikeInputs((prev) => ({ ...prev, [section.bucket]: e.target.value }))
                    }
                    placeholder="Add exclusion term..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => addDislikeTerm(section.bucket)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {t("common.add")}
                  </button>
                </div>

                {list.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => toggleDislikeTerm(section.bucket, item)}
                          className="text-rose-600 hover:text-rose-900 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">{t("onboarding.step6.privacyNotice")}</p>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t("common.save")}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
