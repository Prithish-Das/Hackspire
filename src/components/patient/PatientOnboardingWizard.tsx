import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Heart,
  Plus,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";
import {
  FamilyMemberEntry,
  Language,
  Patient,
  PatientDislikes,
  PatientFamilyInfo,
  PatientInterests,
  PatientMedicalInfo,
  PatientOnboardingDraft,
  User
} from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { SpeakButton } from "../common/SpeakButton";
import { LanguageSelector } from "../common/LanguageSelector";
import {
  clearOnboardingDraft,
  createPatientFromOnboarding,
  getOnboardingDraft,
  registerAccount,
  saveOnboardingDraft,
  setCurrentUser,
  setSelectedPatientId
} from "../../utils/storage";
import {
  INTEREST_OPTIONS,
  UNCOMFORTABLE_TOPIC_SUGGESTIONS
} from "../../utils/contentFilter";
import { syncPatientToBackend } from "../../services/gameApi";

interface PatientOnboardingWizardProps {
  initialEmail?: string;
  initialName?: string;
  passwordForSignup?: string;
  existingPatient?: Patient;
  existingUser?: User;
  onComplete: (user: User, patient: Patient) => void;
  onCancel: () => void;
}

const TOTAL_STEPS = 6;

function createEmptyInterests(): PatientInterests {
  return {
    sports: [],
    entertainment: [],
    lifestyle: [],
    custom: []
  };
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

export const PatientOnboardingWizard: React.FC<PatientOnboardingWizardProps> = ({
  initialEmail = "",
  initialName = "",
  passwordForSignup = "",
  existingPatient,
  existingUser,
  onComplete,
  onCancel
}) => {
  const { t, language, setLanguage } = useLanguage();

  const savedDraft = getOnboardingDraft();
  const canRestoreDraft =
    !existingPatient &&
    savedDraft &&
    (!initialEmail || !savedDraft.email || savedDraft.email.toLowerCase() === initialEmail.toLowerCase());

  const [step, setStep] = useState<number>(() => {
    if (canRestoreDraft && savedDraft.step >= 1 && savedDraft.step <= TOTAL_STEPS) {
      return savedDraft.step;
    }
    return 1;
  });

  // Step 1: Basic Information
  const [fullName, setFullName] = useState<string>(() => {
    if (existingPatient?.basicInfo?.fullName) return existingPatient.basicInfo.fullName;
    if (existingPatient?.name) return existingPatient.name;
    if (canRestoreDraft && savedDraft.basicInfo.fullName) return savedDraft.basicInfo.fullName;
    return initialName;
  });
  const [age, setAge] = useState<string>(() => {
    if (existingPatient?.age) return String(existingPatient.age);
    if (canRestoreDraft && savedDraft.basicInfo.age) return savedDraft.basicInfo.age;
    return "";
  });
  const [city, setCity] = useState<string>(() => {
    if (existingPatient?.city) return existingPatient.city;
    if (canRestoreDraft && savedDraft.basicInfo.city) return savedDraft.basicInfo.city;
    return "";
  });
  const [stateName, setStateName] = useState<string>(() => {
    if (existingPatient?.state) return existingPatient.state;
    if (canRestoreDraft && savedDraft.basicInfo.state) return savedDraft.basicInfo.state;
    return "";
  });
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(() => {
    if (existingPatient?.language) return existingPatient.language;
    if (canRestoreDraft && savedDraft.basicInfo.preferredLanguage) {
      return savedDraft.basicInfo.preferredLanguage;
    }
    return language;
  });

  // Step 2: Medical Background (Voluntary & Non-diagnostic)
  const [medicalInfo, setMedicalInfo] = useState<PatientMedicalInfo>(() => {
    if (existingPatient?.medicalInfo) return existingPatient.medicalInfo;
    if (canRestoreDraft && savedDraft.medicalInfo) return savedDraft.medicalInfo;
    return {
      voluntaryConsentGiven: false,
      hasPriorAssessment: "prefer_not_to_say",
      assessmentDetails: "",
      prescription: {
        hasPrescription: false,
        doctorName: "",
        prescriptionDate: "",
        manualNotes: ""
      }
    };
  });

  // Step 3: Family Information
  const [familyInfo, setFamilyInfo] = useState<PatientFamilyInfo>(() => {
    if (existingPatient?.familyInfo) return existingPatient.familyInfo;
    if (canRestoreDraft && savedDraft.familyInfo) return savedDraft.familyInfo;
    return {
      assistedByCaregiver: false,
      allowInGames: true,
      spouse: { name: "", relationDetail: "" },
      children: [],
      grandchildren: []
    };
  });

  // Step 4: Interests & Preferences
  const [structuredInterests, setStructuredInterests] = useState<PatientInterests>(() => {
    if (existingPatient?.structuredInterests) return existingPatient.structuredInterests;
    if (canRestoreDraft && savedDraft.structuredInterests) return savedDraft.structuredInterests;
    return createEmptyInterests();
  });
  const [customInterestInput, setCustomInterestInput] = useState("");

  // Step 5: Dislikes & Content Restrictions
  const [dislikes, setDislikes] = useState<PatientDislikes>(() => {
    if (existingPatient?.dislikes) return existingPatient.dislikes;
    if (canRestoreDraft && savedDraft.dislikes) return savedDraft.dislikes;
    return createEmptyDislikes();
  });
  const [dislikeInputs, setDislikeInputs] = useState<Record<keyof PatientDislikes, string>>({
    dislikedSportsOrTeams: "",
    dislikedEntertainment: "",
    uncomfortableTopics: "",
    excludedPeopleOrSubjects: "",
    otherExclusions: ""
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync language selection cleanly
  const handleSelectPreferredLanguage = (lang: Language) => {
    setPreferredLanguage(lang);
    setLanguage(lang);
  };

  // Auto-save draft between steps (excluding raw files)
  useEffect(() => {
    if (existingPatient) return;
    const draft: PatientOnboardingDraft = {
      step,
      email: initialEmail,
      basicInfo: {
        fullName,
        age,
        city,
        state: stateName,
        preferredLanguage
      },
      medicalInfo,
      familyInfo,
      structuredInterests,
      dislikes,
      updatedAt: new Date().toISOString()
    };
    saveOnboardingDraft(draft);
  }, [
    step,
    initialEmail,
    fullName,
    age,
    city,
    stateName,
    preferredLanguage,
    medicalInfo,
    familyInfo,
    structuredInterests,
    dislikes,
    existingPatient
  ]);

  const validateStep1 = (): boolean => {
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return false;
    }
    const numericAge = parseInt(age, 10);
    if (Number.isNaN(numericAge) || numericAge < 1 || numericAge > 120) {
      setErrorMsg("Please enter a valid age between 1 and 120.");
      return false;
    }
    if (!city.trim()) {
      setErrorMsg("Please enter your city.");
      return false;
    }
    if (!stateName.trim()) {
      setErrorMsg("Please enter your state.");
      return false;
    }
    return true;
  };

  const hasAnyMedicalDetails = (): boolean => {
    return (
      medicalInfo.hasPriorAssessment === "yes" ||
      Boolean(medicalInfo.assessmentDetails?.trim()) ||
      Boolean(medicalInfo.prescription?.hasPrescription) ||
      Boolean(medicalInfo.prescription?.doctorName?.trim()) ||
      Boolean(medicalInfo.prescription?.manualNotes?.trim()) ||
      Boolean(medicalInfo.prescription?.attachmentMeta)
    );
  };

  const validateStep2 = (): boolean => {
    if (hasAnyMedicalDetails() && !medicalInfo.voluntaryConsentGiven) {
      setErrorMsg(
        "Please tick the voluntary consent confirmation box above before saving medical details, or click 'Skip for now'."
      );
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    setErrorMsg(null);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onCancel();
    }
  };

  const handleSkipOptionalStep = () => {
    setErrorMsg(null);
    if (step === 2) {
      setMedicalInfo({
        voluntaryConsentGiven: false,
        hasPriorAssessment: "skipped",
        assessmentDetails: "",
        prescription: { hasPrescription: false }
      });
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // File metadata handler (Privacy rule: NEVER read or store file bytes in localStorage)
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

  // Family helpers
  const addChild = () => {
    const entry: FamilyMemberEntry = {
      id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      relationDetail: ""
    };
    setFamilyInfo((prev) => ({ ...prev, children: [...prev.children, entry] }));
  };

  const updateChild = (id: string, field: "name" | "relationDetail", value: string) => {
    setFamilyInfo((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    }));
  };

  const removeChild = (id: string) => {
    setFamilyInfo((prev) => ({
      ...prev,
      children: prev.children.filter((c) => c.id !== id)
    }));
  };

  const addGrandchild = () => {
    const entry: FamilyMemberEntry = {
      id: `gchild-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      relationDetail: ""
    };
    setFamilyInfo((prev) => ({ ...prev, grandchildren: [...prev.grandchildren, entry] }));
  };

  const updateGrandchild = (id: string, field: "name" | "relationDetail", value: string) => {
    setFamilyInfo((prev) => ({
      ...prev,
      grandchildren: prev.grandchildren.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    }));
  };

  const removeGrandchild = (id: string) => {
    setFamilyInfo((prev) => ({
      ...prev,
      grandchildren: prev.grandchildren.filter((g) => g.id !== id)
    }));
  };

  // Interests helpers
  const toggleInterest = (
    category: "sports" | "entertainment" | "lifestyle",
    item: string
  ) => {
    setStructuredInterests((prev) => {
      const current = prev[category] || [];
      const exists = current.includes(item);
      return {
        ...prev,
        [category]: exists ? current.filter((x) => x !== item) : [...current, item]
      };
    });
  };

  const addCustomInterest = () => {
    const clean = customInterestInput.trim();
    if (!clean) return;
    setStructuredInterests((prev) => {
      if (prev.custom.some((x) => x.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      return { ...prev, custom: [...prev.custom, clean] };
    });
    setCustomInterestInput("");
  };

  const removeCustomInterest = (item: string) => {
    setStructuredInterests((prev) => ({
      ...prev,
      custom: prev.custom.filter((x) => x !== item)
    }));
  };

  // Dislikes helpers
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
      if (list.some((x) => x.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        [bucket]: [...list, clean]
      };
    });
    setDislikeInputs((prev) => ({ ...prev, [bucket]: "" }));
  };

  // Finalize Onboarding
  const handleCompleteOnboarding = () => {
    setErrorMsg(null);
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    const numericAge = parseInt(age, 10) || 70;
    const birthYear = new Date().getFullYear() - numericAge;
    const cleanName = fullName.trim();
    const cleanCity = city.trim();
    const cleanState = stateName.trim();

    const cleanedChildren = familyInfo.children
      .filter((c) => c.name.trim().length > 0)
      .map((c) => ({ ...c, name: c.name.trim(), relationDetail: c.relationDetail?.trim() }));

    const cleanedGrandchildren = familyInfo.grandchildren
      .filter((g) => g.name.trim().length > 0)
      .map((g) => ({ ...g, name: g.name.trim(), relationDetail: g.relationDetail?.trim() }));

    const cleanedFamily: PatientFamilyInfo = {
      assistedByCaregiver: Boolean(familyInfo.assistedByCaregiver),
      allowInGames: familyInfo.allowInGames !== false,
      spouse: familyInfo.spouse?.name?.trim()
        ? {
            name: familyInfo.spouse.name.trim(),
            relationDetail: familyInfo.spouse.relationDetail?.trim()
          }
        : undefined,
      children: cleanedChildren,
      grandchildren: cleanedGrandchildren
    };

    // Combine only favourite interests into patient.interests (NEVER dislikes)
    const flatInterests = Array.from(
      new Set([
        ...structuredInterests.sports,
        ...structuredInterests.entertainment,
        ...structuredInterests.lifestyle,
        ...structuredInterests.custom
      ])
    );

    const newPatientId = existingPatient?.id || `p-${Date.now()}`;
    const regionLabel = [cleanCity, cleanState].filter(Boolean).join(", ");

    const patientRecord: Patient = {
      id: newPatientId,
      name: cleanName,
      age: numericAge,
      birthYear,
      region: regionLabel,
      city: cleanCity,
      state: cleanState,
      language: preferredLanguage,
      interests: flatInterests,
      caretakerId: existingPatient?.caretakerId || "c1",
      doctorIds: existingPatient?.doctorIds || ["d1"],
      emergencyContact: existingPatient?.emergencyContact,
      baselineScore: existingPatient?.baselineScore ?? 75,
      onboardingCompleted: true,
      basicInfo: {
        fullName: cleanName,
        age: numericAge,
        city: cleanCity,
        state: cleanState,
        preferredLanguage
      },
      medicalInfo,
      familyInfo: cleanedFamily,
      structuredInterests,
      dislikes
    };

    const savedPatient = createPatientFromOnboarding(patientRecord);

    let activeUser: User;
    if (existingUser) {
      activeUser = {
        ...existingUser,
        name: cleanName,
        patientId: savedPatient.id
      };
    } else {
      const reg = registerAccount({
        name: cleanName,
        email: initialEmail || `${savedPatient.id}@recalled.care`,
        password: passwordForSignup || "recalled123",
        role: "patient",
        patientId: savedPatient.id
      });

      if (!reg.ok) {
        setErrorMsg(reg.error);
        return;
      }

      activeUser = {
        id: reg.account.id,
        name: reg.account.name,
        email: reg.account.email,
        role: "patient",
        patientId: savedPatient.id
      };
    }

    setCurrentUser(activeUser);
    setSelectedPatientId(savedPatient.id);
    clearOnboardingDraft();
    void syncPatientToBackend(savedPatient);
    onComplete(activeUser, savedPatient);
  };

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  const stepTitles = [
    t("onboarding.step1.title"),
    t("onboarding.step2.title"),
    t("onboarding.step3.title"),
    t("onboarding.step4.title"),
    t("onboarding.step5.title"),
    t("onboarding.step6.title")
  ];

  const allDislikesCount =
    dislikes.dislikedSportsOrTeams.length +
    dislikes.dislikedEntertainment.length +
    dislikes.uncomfortableTopics.length +
    dislikes.excludedPeopleOrSubjects.length +
    dislikes.otherExclusions.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
            R
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-lg block leading-none">
              RECALLED
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {t("onboarding.title")}
            </span>
          </div>
        </div>

        <LanguageSelector variant="compact" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-3xl mx-auto my-4 bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        {/* Progress Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs sm:text-sm font-bold">
              {t("onboarding.stepOf", { current: step, total: TOTAL_STEPS })}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {t("onboarding.draftSaved")}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{stepTitles[step - 1]}</span>
                <SpeakButton
                  text={`${stepTitles[step - 1]}`}
                  id={`onb-step-${step}`}
                  size="sm"
                />
              </h1>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm font-semibold flex items-start gap-2.5"
          >
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: BASIC INFORMATION */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t("onboarding.step1.subtitle")}
            </p>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                {t("onboarding.step1.fullName")} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anand Sharma"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t("onboarding.step1.age")} *
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 72"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t("onboarding.step1.city")} *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kolkata"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t("onboarding.step1.state")} *
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. West Bengal"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                {t("onboarding.step1.language")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { code: "en", label: "English" },
                    { code: "bn", label: "বাংলা (Bengali)" },
                    { code: "hi", label: "हिन्दी (Hindi)" }
                  ] as { code: Language; label: string }[]
                ).map((item) => {
                  const selected = preferredLanguage === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectPreferredLanguage(item.code)}
                      className={`p-3.5 rounded-2xl border-2 text-base font-bold transition-all cursor-pointer flex items-center justify-between ${
                        selected
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span>{item.label}</span>
                      {selected && <Check className="w-5 h-5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEDICAL BACKGROUND (VOLUNTARY & NON-DIAGNOSTIC) */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t("onboarding.step2.subtitle")}
            </p>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-sm font-medium flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <span>{t("onboarding.step2.nonDiagnostic")}</span>
            </div>

            {/* Prior diagnosis/assessment question */}
            <div className="space-y-2.5">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                {t("onboarding.step2.assessmentQ")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    { value: "yes", label: t("common.yes") },
                    { value: "no", label: t("common.no") },
                    { value: "prefer_not_to_say", label: t("onboarding.step2.preferNot") }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setMedicalInfo((prev) => ({ ...prev, hasPriorAssessment: opt.value }))
                    }
                    className={`p-3.5 rounded-xl border-2 font-bold text-sm sm:text-base cursor-pointer transition-all ${
                      medicalInfo.hasPriorAssessment === opt.value
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {medicalInfo.hasPriorAssessment === "yes" && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("onboarding.step2.assessmentDetails")}
                  </label>
                  <input
                    type="text"
                    value={medicalInfo.assessmentDetails || ""}
                    onChange={(e) =>
                      setMedicalInfo((prev) => ({ ...prev, assessmentDetails: e.target.value }))
                    }
                    placeholder="e.g. Memory clinic checkup in 2024"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Doctor's prescription question */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-800">
                {t("onboarding.step2.prescriptionQ")}
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {[true, false].map((val) => {
                  const selected = Boolean(medicalInfo.prescription?.hasPrescription) === val;
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() =>
                        setMedicalInfo((prev) => ({
                          ...prev,
                          prescription: {
                            ...(prev.prescription || {}),
                            hasPrescription: val
                          }
                        }))
                      }
                      className={`p-3 rounded-xl border-2 font-bold text-sm sm:text-base cursor-pointer ${
                        selected
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      {val ? t("common.yes") : t("common.no")}
                    </button>
                  );
                })}
              </div>

              {medicalInfo.prescription?.hasPrescription && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                              doctorName: e.target.value
                            }
                          }))
                        }
                        placeholder="e.g. Dr. Arvind Mukherjee"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                              prescriptionDate: e.target.value
                            }
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
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
                            manualNotes: e.target.value
                          }
                        }))
                      }
                      placeholder="Optional non-sensitive summary notes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t("onboarding.step2.uploadLabel")}
                    </label>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer text-sm font-semibold text-slate-700">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Choose PDF or Image (metadata only)</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handlePrescriptionFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {t("onboarding.step2.uploadHint")}
                    </p>

                    {medicalInfo.prescription?.attachmentMeta && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-700" />
                          <span>
                            <strong>{medicalInfo.prescription.attachmentMeta.fileName}</strong> (
                            {Math.max(
                              1,
                              Math.round(medicalInfo.prescription.attachmentMeta.fileSizeBytes / 1024)
                            )}{" "}
                            KB — metadata recorded only)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMedicalInfo((prev) => ({
                              ...prev,
                              prescription: {
                                ...(prev.prescription || { hasPrescription: true }),
                                attachmentMeta: undefined
                              }
                            }))
                          }
                          className="text-slate-500 hover:text-rose-600 p-1 cursor-pointer"
                          aria-label="Remove attachment metadata"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Voluntary consent checkbox */}
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={medicalInfo.voluntaryConsentGiven}
                onChange={(e) =>
                  setMedicalInfo((prev) => ({
                    ...prev,
                    voluntaryConsentGiven: e.target.checked
                  }))
                }
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-800">
                {t("onboarding.step2.consentLabel")}
              </span>
            </label>
          </div>
        )}

        {/* STEP 3: FAMILY INFORMATION */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t("onboarding.step3.subtitle")}
            </p>

            {/* Caregiver assistance & game consent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(familyInfo.assistedByCaregiver)}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      assistedByCaregiver: e.target.checked
                    }))
                  }
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm font-semibold text-slate-800">
                  {t("onboarding.step3.assisted")}
                </span>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-blue-200 bg-blue-50/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyInfo.allowInGames !== false}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      allowInGames: e.target.checked
                    }))
                  }
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm font-semibold text-blue-950">
                  {t("onboarding.step3.allowInGames")}
                </span>
              </label>
            </div>

            {/* Spouse */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{t("onboarding.step3.spouse")}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={familyInfo.spouse?.name || ""}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      spouse: {
                        ...(prev.spouse || { name: "" }),
                        name: e.target.value
                      }
                    }))
                  }
                  placeholder="e.g. Meera Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={familyInfo.spouse?.relationDetail || ""}
                  onChange={(e) =>
                    setFamilyInfo((prev) => ({
                      ...prev,
                      spouse: {
                        ...(prev.spouse || { name: "" }),
                        relationDetail: e.target.value
                      }
                    }))
                  }
                  placeholder={t("onboarding.step3.relationDetail")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Children */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{t("onboarding.step3.children")}</span>
                </h3>
                <button
                  type="button"
                  onClick={addChild}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("onboarding.step3.addChild")}</span>
                </button>
              </div>

              {familyInfo.children.length === 0 && (
                <p className="text-xs text-slate-500">
                  No children added yet. Click "{t("onboarding.step3.addChild")}" to add one or more entries.
                </p>
              )}

              <div className="space-y-2.5">
                {familyInfo.children.map((child, idx) => (
                  <div key={child.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => updateChild(child.id, "name", e.target.value)}
                      placeholder={`Child ${idx + 1} name (e.g. Priya)`}
                      className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={child.relationDetail || ""}
                      onChange={(e) => updateChild(child.id, "relationDetail", e.target.value)}
                      placeholder="e.g. Elder Daughter"
                      className="sm:col-span-6 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="sm:col-span-1 p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                      aria-label="Remove child"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Grandchildren */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{t("onboarding.step3.grandchildren")}</span>
                </h3>
                <button
                  type="button"
                  onClick={addGrandchild}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("onboarding.step3.addGrandchild")}</span>
                </button>
              </div>

              {familyInfo.grandchildren.length === 0 && (
                <p className="text-xs text-slate-500">
                  No grandchildren added yet. Click "{t("onboarding.step3.addGrandchild")}" to add one or more entries.
                </p>
              )}

              <div className="space-y-2.5">
                {familyInfo.grandchildren.map((gc, idx) => (
                  <div key={gc.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={gc.name}
                      onChange={(e) => updateGrandchild(gc.id, "name", e.target.value)}
                      placeholder={`Grandchild ${idx + 1} name (e.g. Aarav)`}
                      className="sm:col-span-5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={gc.relationDetail || ""}
                      onChange={(e) => updateGrandchild(gc.id, "relationDetail", e.target.value)}
                      placeholder="e.g. Grandson, loves painting"
                      className="sm:col-span-6 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeGrandchild(gc.id)}
                      className="sm:col-span-1 p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                      aria-label="Remove grandchild"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: INTERESTS & PREFERENCES */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t("onboarding.step4.subtitle")}
            </p>

            {/* Sports */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">{t("onboarding.step4.sports")}</h3>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.sports.map((item) => {
                  const active = structuredInterests.sports.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest("sports", item)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entertainment */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">
                {t("onboarding.step4.entertainment")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.entertainment.map((item) => {
                  const active = structuredInterests.entertainment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest("entertainment", item)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                        active
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lifestyle */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">{t("onboarding.step4.lifestyle")}</h3>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.lifestyle.map((item) => {
                  const active = structuredInterests.lifestyle.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest("lifestyle", item)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                        active
                          ? "border-teal-600 bg-teal-600 text-white shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interests */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="block text-sm font-bold text-slate-800">Custom Interests</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInterestInput}
                  onChange={(e) => setCustomInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomInterest();
                    }
                  }}
                  placeholder={t("onboarding.step4.customPlaceholder")}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
                >
                  {t("common.add")}
                </button>
              </div>

              {structuredInterests.custom.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {structuredInterests.custom.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-bold"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomInterest(item)}
                        className="text-blue-600 hover:text-rose-600 cursor-pointer"
                        aria-label={`Remove ${item}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: DISLIKES & CONTENT RESTRICTIONS */}
        {step === 5 && (
          <div className="space-y-5">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t("onboarding.step5.subtitle")}
            </p>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-sm font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <span>{t("onboarding.step5.strongRuleNotice")}</span>
            </div>

            {(
              [
                {
                  bucket: "dislikedSportsOrTeams" as keyof PatientDislikes,
                  label: t("onboarding.step5.dislikedSports"),
                  placeholder: "e.g. Cricket, Boxing...",
                  suggestions: ["Cricket", "Football", "Tennis", "Hockey"]
                },
                {
                  bucket: "dislikedEntertainment" as keyof PatientDislikes,
                  label: t("onboarding.step5.dislikedEntertainment"),
                  placeholder: "e.g. Cartoons, Action movies...",
                  suggestions: ["Television", "Movies", "Cartoons", "Loud music"]
                },
                {
                  bucket: "uncomfortableTopics" as keyof PatientDislikes,
                  label: t("onboarding.step5.uncomfortableTopics"),
                  placeholder: "e.g. Hospitals, Crowds...",
                  suggestions: [...UNCOMFORTABLE_TOPIC_SUGGESTIONS]
                },
                {
                  bucket: "excludedPeopleOrSubjects" as keyof PatientDislikes,
                  label: t("onboarding.step5.excludedPeople"),
                  placeholder: "Enter a person name or subject to exclude...",
                  suggestions: []
                },
                {
                  bucket: "otherExclusions" as keyof PatientDislikes,
                  label: t("onboarding.step5.otherExclusions"),
                  placeholder: "Any other words, places, or themes to exclude...",
                  suggestions: []
                }
              ] as const
            ).map((section) => {
              const items = dislikes[section.bucket];
              return (
                <div
                  key={section.bucket}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5"
                >
                  <label className="block text-sm font-bold text-slate-900">
                    {section.label}
                  </label>

                  {section.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {section.suggestions.map((sug) => {
                        const active = items.some(
                          (x) => x.toLowerCase() === sug.toLowerCase()
                        );
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => toggleDislikeTerm(section.bucket, sug)}
                            className={`px-3 py-1.5 rounded-xl border-2 text-xs sm:text-sm font-bold cursor-pointer transition-all ${
                              active
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
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
                        setDislikeInputs((prev) => ({
                          ...prev,
                          [section.bucket]: e.target.value
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDislikeTerm(section.bucket);
                        }
                      }}
                      placeholder={section.placeholder}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addDislikeTerm(section.bucket)}
                      className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      {t("common.add")}
                    </button>
                  </div>

                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-bold"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => toggleDislikeTerm(section.bucket, item)}
                            className="text-rose-600 hover:text-rose-900 cursor-pointer"
                            aria-label={`Remove exclusion ${item}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 6: REVIEW & CONFIRM */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {t("onboarding.step6.subtitle")}
            </p>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Basic */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-blue-700">
                    {t("onboarding.step1.title")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t("common.edit")}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-600">
                  Age: {age} • {city}, {stateName} • Language: {preferredLanguage.toUpperCase()}
                </p>
              </div>

              {/* Medical */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-blue-700">
                    {t("onboarding.step2.title")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t("common.edit")}
                  </button>
                </div>
                <p className="text-xs text-slate-700">
                  Assessment: <strong className="capitalize">{medicalInfo.hasPriorAssessment}</strong>
                </p>
                <p className="text-xs text-slate-700">
                  Prescription:{" "}
                  <strong>{medicalInfo.prescription?.hasPrescription ? "Provided" : "None"}</strong>
                  {medicalInfo.prescription?.attachmentMeta
                    ? ` (${medicalInfo.prescription.attachmentMeta.fileName})`
                    : ""}
                </p>
              </div>

              {/* Family */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-blue-700">
                    {t("onboarding.step3.title")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t("common.edit")}
                  </button>
                </div>
                <p className="text-xs text-slate-700">
                  Spouse: {familyInfo.spouse?.name?.trim() || "Not listed"}
                </p>
                <p className="text-xs text-slate-700">
                  Children:{" "}
                  {familyInfo.children.filter((c) => c.name.trim()).length > 0
                    ? familyInfo.children
                        .filter((c) => c.name.trim())
                        .map((c) => c.name)
                        .join(", ")
                    : "None listed"}
                </p>
                <p className="text-xs text-slate-700">
                  Grandchildren:{" "}
                  {familyInfo.grandchildren.filter((g) => g.name.trim()).length > 0
                    ? familyInfo.grandchildren
                        .filter((g) => g.name.trim())
                        .map((g) => g.name)
                        .join(", ")
                    : "None listed"}
                </p>
              </div>

              {/* Interests & Dislikes */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-blue-700">
                    {t("onboarding.step4.title")} & {t("onboarding.step5.title")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Edit Likes
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Edit Exclusions
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700">
                  Interests:{" "}
                  <strong>
                    {[
                      ...structuredInterests.sports,
                      ...structuredInterests.entertainment,
                      ...structuredInterests.lifestyle,
                      ...structuredInterests.custom
                    ].join(", ") || "None selected"}
                  </strong>
                </p>
                <p className="text-xs text-rose-800 font-semibold">
                  Excluded topics/items: {allDislikesCount} rule(s) active
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-xs sm:text-sm text-slate-700 font-medium">
              {t("onboarding.step6.privacyNotice")}
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("common.back")}</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 ml-auto">
            {step >= 2 && step <= 5 && (
              <button
                type="button"
                onClick={handleSkipOptionalStep}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-sm cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                <span>{t("onboarding.skipStep")}</span>
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-sm cursor-pointer"
              >
                <span>{t("onboarding.continue")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t("onboarding.complete")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="w-full max-w-lg mx-auto text-center py-3">
        <p className="text-xs text-slate-500 font-medium">{t("app.disclaimer")}</p>
      </div>
    </div>
  );
};
