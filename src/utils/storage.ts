import {
  Patient,
  Caretaker,
  Doctor,
  User,
  Reminder,
  WaterEvent,
  Prescription,
  MemoryAlbumItem,
  CaregiverNote,
  AlertItem,
  GameSession,
  DomainStats,
  MemoryLaneMemory,
  AccessibilitySettings,
  CognitiveDomain,
  ReminderStatus,
  PatientOnboardingDraft,
  RegisteredAccount,
  Role,
  PatientDislikes
} from "../types";

import {
  initialPatients,
  initialCaretakers,
  initialDoctors,
  initialReminders,
  initialWaterEvents,
  initialPrescriptions,
  initialMemoryAlbum,
  initialCaregiverNotes,
  initialAlerts,
  initialMemoriesTimeline,
  initialGameSessions,
  initialDomainStats
} from "../data/initialData";

const STORAGE_VERSION_KEY = "recalled_storage_version";
const CURRENT_VERSION = "2.1";

const KEYS = {
  PATIENTS: "recalled_patients",
  CARETAKERS: "recalled_caretakers",
  DOCTORS: "recalled_doctors",
  REMINDERS: "recalled_reminders",
  WATER_EVENTS: "recalled_water_events",
  PRESCRIPTIONS: "recalled_prescriptions",
  MEMORY_ALBUM: "recalled_memory_album",
  NOTES: "recalled_caregiver_notes",
  ALERTS: "recalled_alerts",
  MEMORIES_TIMELINE: "recalled_memories_timeline",
  GAME_SESSIONS: "recalled_game_sessions",
  DOMAIN_STATS: "recalled_domain_stats",
  CURRENT_USER: "recalled_current_user",
  SELECTED_PATIENT: "recalled_selected_patient_id",
  ACCESSIBILITY: "recalled_accessibility",
  REGISTERED_ACCOUNTS: "recalled_registered_accounts",
  ONBOARDING_DRAFT: "recalled_onboarding_draft"
};

// Safe JSON Parse helper (avoid logging sensitive payloads)
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

// Safe JSON Set helper
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota or unavailable fallback
  }
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

/**
 * Normalizes a patient record so legacy seed data and newly onboarded patients
 * both have consistent, backward-compatible structured fields.
 */
export function normalizePatientRecord(raw: Patient): Patient {
  const regionParts = (raw.region || "").split(",").map((s) => s.trim());
  const derivedCity = raw.city ?? raw.basicInfo?.city ?? (regionParts[0] || "");
  const derivedState = raw.state ?? raw.basicInfo?.state ?? (regionParts[1] || "");

  return {
    ...raw,
    city: derivedCity,
    state: derivedState,
    region:
      raw.region ||
      [derivedCity, derivedState].filter(Boolean).join(", ") ||
      "India",
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    doctorIds: Array.isArray(raw.doctorIds) ? raw.doctorIds : ["d1"],
    caretakerId: raw.caretakerId || "c1",
    onboardingCompleted:
      raw.onboardingCompleted !== undefined ? raw.onboardingCompleted : true,
    basicInfo: raw.basicInfo || {
      fullName: raw.name,
      age: raw.age,
      city: derivedCity,
      state: derivedState,
      preferredLanguage: raw.language || "en"
    },
    medicalInfo: raw.medicalInfo || {
      voluntaryConsentGiven: false,
      hasPriorAssessment: "skipped"
    },
    familyInfo: {
      assistedByCaregiver: raw.familyInfo?.assistedByCaregiver ?? false,
      allowInGames: raw.familyInfo?.allowInGames ?? true,
      spouse: raw.familyInfo?.spouse,
      children: Array.isArray(raw.familyInfo?.children) ? raw.familyInfo.children : [],
      grandchildren: Array.isArray(raw.familyInfo?.grandchildren)
        ? raw.familyInfo.grandchildren
        : []
    },
    structuredInterests: {
      sports: Array.isArray(raw.structuredInterests?.sports)
        ? raw.structuredInterests.sports
        : [],
      entertainment: Array.isArray(raw.structuredInterests?.entertainment)
        ? raw.structuredInterests.entertainment
        : [],
      lifestyle: Array.isArray(raw.structuredInterests?.lifestyle)
        ? raw.structuredInterests.lifestyle
        : [],
      custom: Array.isArray(raw.structuredInterests?.custom)
        ? raw.structuredInterests.custom
        : []
    },
    dislikes: {
      ...createEmptyDislikes(),
      ...(raw.dislikes || {}),
      dislikedSportsOrTeams: Array.isArray(raw.dislikes?.dislikedSportsOrTeams)
        ? raw.dislikes.dislikedSportsOrTeams
        : [],
      dislikedEntertainment: Array.isArray(raw.dislikes?.dislikedEntertainment)
        ? raw.dislikes.dislikedEntertainment
        : [],
      uncomfortableTopics: Array.isArray(raw.dislikes?.uncomfortableTopics)
        ? raw.dislikes.uncomfortableTopics
        : [],
      excludedPeopleOrSubjects: Array.isArray(raw.dislikes?.excludedPeopleOrSubjects)
        ? raw.dislikes.excludedPeopleOrSubjects
        : [],
      otherExclusions: Array.isArray(raw.dislikes?.otherExclusions)
        ? raw.dislikes.otherExclusions
        : []
    }
  };
}

// Migration & Bootstrap initialization
export function initializeStorage(): void {
  const version = localStorage.getItem(STORAGE_VERSION_KEY);

  if (!version || version !== CURRENT_VERSION) {
    if (!localStorage.getItem(KEYS.PATIENTS)) {
      safeSet(KEYS.PATIENTS, initialPatients);
    } else {
      const existing = safeGet<Patient[]>(KEYS.PATIENTS, initialPatients);
      safeSet(KEYS.PATIENTS, existing.map(normalizePatientRecord));
    }
    if (!localStorage.getItem(KEYS.CARETAKERS)) {
      safeSet(KEYS.CARETAKERS, initialCaretakers);
    }
    if (!localStorage.getItem(KEYS.DOCTORS)) {
      safeSet(KEYS.DOCTORS, initialDoctors);
    }
    if (!localStorage.getItem(KEYS.REMINDERS)) {
      safeSet(KEYS.REMINDERS, initialReminders);
    }
    if (!localStorage.getItem(KEYS.WATER_EVENTS)) {
      safeSet(KEYS.WATER_EVENTS, initialWaterEvents);
    }
    if (!localStorage.getItem(KEYS.PRESCRIPTIONS)) {
      safeSet(KEYS.PRESCRIPTIONS, initialPrescriptions);
    }
    if (!localStorage.getItem(KEYS.MEMORY_ALBUM)) {
      safeSet(KEYS.MEMORY_ALBUM, initialMemoryAlbum);
    }
    if (!localStorage.getItem(KEYS.NOTES)) {
      safeSet(KEYS.NOTES, initialCaregiverNotes);
    }
    if (!localStorage.getItem(KEYS.ALERTS)) {
      safeSet(KEYS.ALERTS, initialAlerts);
    }
    if (!localStorage.getItem(KEYS.MEMORIES_TIMELINE)) {
      safeSet(KEYS.MEMORIES_TIMELINE, initialMemoriesTimeline);
    }
    if (!localStorage.getItem(KEYS.GAME_SESSIONS)) {
      safeSet(KEYS.GAME_SESSIONS, initialGameSessions);
    }
    if (!localStorage.getItem(KEYS.DOMAIN_STATS)) {
      safeSet(KEYS.DOMAIN_STATS, initialDomainStats);
    }

    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
  }
}

// Immediately ensure storage is initialized
initializeStorage();

// Lightweight deterministic prototype credential hash (never stores or logs plaintext passwords)
export function hashPrototypeCredential(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `h_${(h2 >>> 0).toString(16)}_${(h1 >>> 0).toString(16)}`;
}

// Registered Accounts API (Prototype Auth)
export function getRegisteredAccounts(): RegisteredAccount[] {
  return safeGet<RegisteredAccount[]>(KEYS.REGISTERED_ACCOUNTS, []);
}

export function findRegisteredAccountByEmail(
  email: string,
  role?: Role
): RegisteredAccount | undefined {
  const norm = email.trim().toLowerCase();
  return getRegisteredAccounts().find(
    (acc) => acc.email.toLowerCase() === norm && (!role || acc.role === role)
  );
}

export function registerAccount(params: {
  name: string;
  email: string;
  password: string;
  role: Role;
  patientId?: string;
  caretakerId?: string;
  doctorId?: string;
}): { ok: true; account: RegisteredAccount } | { ok: false; error: string } {
  const normEmail = params.email.trim().toLowerCase();
  if (!normEmail || !params.password) {
    return { ok: false, error: "Email and password are required." };
  }

  const existing = getRegisteredAccounts();
  if (existing.some((acc) => acc.email.toLowerCase() === normEmail && acc.role === params.role)) {
    return { ok: false, error: "An account with this email and role already exists." };
  }

  const account: RegisteredAccount = {
    id: `u-${Date.now()}`,
    name: params.name.trim(),
    email: normEmail,
    passwordHash: hashPrototypeCredential(params.password),
    role: params.role,
    patientId: params.patientId,
    caretakerId: params.caretakerId,
    doctorId: params.doctorId,
    createdAt: new Date().toISOString()
  };

  safeSet(KEYS.REGISTERED_ACCOUNTS, [...existing, account]);
  return { ok: true, account };
}

export function authenticateAccount(
  email: string,
  password: string,
  role: Role
): { ok: true; user: User } | { ok: false; error: string } {
  const normEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const match = accounts.find(
    (acc) => acc.email.toLowerCase() === normEmail && acc.role === role
  );

  if (!match) {
    return {
      ok: false,
      error: "No registered account found for this email and role. Please sign up or use Demo Login."
    };
  }

  if (match.passwordHash !== hashPrototypeCredential(password)) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  const user: User = {
    id: match.id,
    name: match.name,
    email: match.email,
    role: match.role,
    patientId: match.patientId,
    caretakerId: match.caretakerId,
    doctorId: match.doctorId
  };

  return { ok: true, user };
}

// Onboarding Draft API
export function getOnboardingDraft(): PatientOnboardingDraft | null {
  return safeGet<PatientOnboardingDraft | null>(KEYS.ONBOARDING_DRAFT, null);
}

export function saveOnboardingDraft(draft: PatientOnboardingDraft): void {
  safeSet(KEYS.ONBOARDING_DRAFT, draft);
}

export function clearOnboardingDraft(): void {
  try {
    localStorage.removeItem(KEYS.ONBOARDING_DRAFT);
  } catch {
    // Ignore
  }
}

// Current User Management
export function getCurrentUser(): User | null {
  const user = safeGet<User | null>(KEYS.CURRENT_USER, null);
  if (!user) {
    const defaultUser: User = {
      id: "u-patient",
      name: "Anand Sharma",
      email: "anand.sharma@example.com",
      role: "patient",
      patientId: "p1"
    };
    safeSet(KEYS.CURRENT_USER, defaultUser);
    return defaultUser;
  }
  return user;
}

export function setCurrentUser(user: User | null): void {
  safeSet(KEYS.CURRENT_USER, user);
}

// Selected Patient Management (for Doctor & Caretaker views)
export function getSelectedPatientId(): string {
  const saved = safeGet<string>(KEYS.SELECTED_PATIENT, "p1");
  return saved || "p1";
}

export function setSelectedPatientId(id: string): void {
  safeSet(KEYS.SELECTED_PATIENT, id);
}

// Caretakers & Doctors API
export function getCaretakers(): Caretaker[] {
  return safeGet<Caretaker[]>(KEYS.CARETAKERS, initialCaretakers);
}

export function saveCaretaker(caretaker: Caretaker): void {
  const all = getCaretakers();
  const idx = all.findIndex((c) => c.id === caretaker.id);
  if (idx >= 0) {
    all[idx] = caretaker;
  } else {
    all.push(caretaker);
  }
  safeSet(KEYS.CARETAKERS, all);
}

export function getDoctors(): Doctor[] {
  return safeGet<Doctor[]>(KEYS.DOCTORS, initialDoctors);
}

export function saveDoctor(doctor: Doctor): void {
  const all = getDoctors();
  const idx = all.findIndex((d) => d.id === doctor.id);
  if (idx >= 0) {
    all[idx] = doctor;
  } else {
    all.push(doctor);
  }
  safeSet(KEYS.DOCTORS, all);
}

// Patients API
export function getPatients(): Patient[] {
  const raw = safeGet<Patient[]>(KEYS.PATIENTS, initialPatients);
  return raw.map(normalizePatientRecord);
}

export function getPatientById(id: string): Patient | undefined {
  const list = getPatients();
  return list.find((p) => p.id === id);
}

export function updatePatient(patient: Patient): void {
  const list = getPatients();
  const normalized = normalizePatientRecord({
    ...patient,
    updatedAt: new Date().toISOString()
  });
  const index = list.findIndex((p) => p.id === normalized.id);
  if (index >= 0) {
    list[index] = normalized;
  } else {
    list.push(normalized);
  }
  safeSet(KEYS.PATIENTS, list);
}

export function createPatientFromOnboarding(patient: Patient): Patient {
  const normalized = normalizePatientRecord({
    ...patient,
    onboardingCompleted: true,
    updatedAt: new Date().toISOString()
  });

  updatePatient(normalized);
  // Seed initial domain stats so dashboard, games hub, and progress work immediately
  getDomainStats(normalized.id);

  // Also ensure the assigned caretaker and doctor include this patient in their roster
  const caretakers = getCaretakers();
  const caretaker = caretakers.find((c) => c.id === normalized.caretakerId);
  if (caretaker && !caretaker.patientIds.includes(normalized.id)) {
    caretaker.patientIds.push(normalized.id);
    saveCaretaker(caretaker);
  }

  const doctors = getDoctors();
  normalized.doctorIds.forEach((docId) => {
    const doc = doctors.find((d) => d.id === docId);
    if (doc && !doc.patientIds.includes(normalized.id)) {
      doc.patientIds.push(normalized.id);
      saveDoctor(doc);
    }
  });

  return normalized;
}

/**
 * Immediately adds a reported uncomfortable topic/subject to the patient's exclusion list.
 */
export function addPatientContentExclusion(
  patientId: string,
  term: string,
  bucket: keyof PatientDislikes = "otherExclusions"
): Patient | undefined {
  const clean = term.trim();
  if (!clean) return undefined;

  const patient = getPatientById(patientId);
  if (!patient) return undefined;

  const currentDislikes = patient.dislikes || createEmptyDislikes();
  const existingList = currentDislikes[bucket] || [];
  if (existingList.some((item) => item.toLowerCase() === clean.toLowerCase())) {
    return patient;
  }

  const updated: Patient = {
    ...patient,
    dislikes: {
      ...currentDislikes,
      [bucket]: [...existingList, clean]
    }
  };
  updatePatient(updated);
  return updated;
}

/**
 * Role-based patient access control:
 * - Patient: ONLY their own patientId (never unrelated patients)
 * - Caretaker: ONLY patients assigned to their caretakerId / patientIds
 * - Doctor: ONLY patients assigned to their doctorId / patientIds
 */
export function getAccessiblePatientsForUser(user: User | null): Patient[] {
  if (!user) return [];
  const all = getPatients();

  if (user.role === "patient") {
    return user.patientId ? all.filter((p) => p.id === user.patientId) : [];
  }

  if (user.role === "caretaker") {
    const caretaker = getCaretakers().find((c) => c.id === user.caretakerId);
    return all.filter(
      (p) =>
        p.caretakerId === user.caretakerId ||
        (caretaker ? caretaker.patientIds.includes(p.id) : false)
    );
  }

  if (user.role === "doctor") {
    const doctor = getDoctors().find((d) => d.id === user.doctorId);
    return all.filter(
      (p) =>
        (user.doctorId ? p.doctorIds.includes(user.doctorId) : false) ||
        (doctor ? doctor.patientIds.includes(p.id) : false)
    );
  }

  return [];
}

export function canUserAccessPatient(user: User | null, patientId: string): boolean {
  if (!user || !patientId) return false;
  return getAccessiblePatientsForUser(user).some((p) => p.id === patientId);
}

// Reminders API (Single Source of Truth)
export function getReminders(patientId?: string): Reminder[] {
  const all = safeGet<Reminder[]>(KEYS.REMINDERS, initialReminders);
  if (!patientId) return all;
  return all.filter((r) => r.patientId === patientId);
}

export function saveReminder(reminder: Reminder): void {
  const all = getReminders();
  const index = all.findIndex((r) => r.id === reminder.id);
  if (index >= 0) {
    all[index] = reminder;
  } else {
    all.push(reminder);
  }
  safeSet(KEYS.REMINDERS, all);
}

export function updateReminderStatus(
  id: string,
  status: ReminderStatus,
  options?: { snoozedUntil?: string; note?: string }
): Reminder | null {
  const all = getReminders();
  const target = all.find((r) => r.id === id);
  if (!target) return null;

  target.status = status;
  if (options?.snoozedUntil) {
    target.snoozedUntil = options.snoozedUntil;
  }
  if (!target.adherenceHistory) {
    target.adherenceHistory = [];
  }
  target.adherenceHistory.push({
    date: new Date().toISOString().split("T")[0],
    status,
    timestamp: new Date().toISOString()
  });

  safeSet(KEYS.REMINDERS, all);
  return target;
}

export function deleteReminder(id: string): void {
  const all = getReminders().filter((r) => r.id !== id);
  safeSet(KEYS.REMINDERS, all);
}

// Water Events API
export function getWaterEvents(patientId?: string): WaterEvent[] {
  const all = safeGet<WaterEvent[]>(KEYS.WATER_EVENTS, initialWaterEvents);
  if (!patientId) return all;
  return all.filter((we) => we.patientId === patientId);
}

export function saveWaterEvent(event: WaterEvent): void {
  const all = getWaterEvents();
  const index = all.findIndex((we) => we.id === event.id);
  if (index >= 0) {
    all[index] = event;
  } else {
    all.push(event);
  }
  safeSet(KEYS.WATER_EVENTS, all);
}

// Prescriptions API
export function getPrescriptions(patientId?: string): Prescription[] {
  const all = safeGet<Prescription[]>(KEYS.PRESCRIPTIONS, initialPrescriptions);
  if (!patientId) return all;
  return all.filter((rx) => rx.patientId === patientId);
}

export function savePrescription(prescription: Prescription): void {
  const all = getPrescriptions();
  const index = all.findIndex((rx) => rx.id === prescription.id);
  if (index >= 0) {
    all[index] = prescription;
  } else {
    all.unshift(prescription);
  }
  safeSet(KEYS.PRESCRIPTIONS, all);
}

// Memory Album API (Feeds Game 3 & Caretaker Album)
export function getMemoryAlbum(patientId?: string): MemoryAlbumItem[] {
  let all = safeGet<MemoryAlbumItem[]>(KEYS.MEMORY_ALBUM, initialMemoryAlbum);
  let updated = false;
  all = all.map((item) => {
    if (item.id === "ma-1" && item.image.includes("unsplash")) {
      updated = true;
      return { ...item, image: "/graduation_family.jpg" };
    }
    if (item.id === "ma-2" && (item.image.includes("unsplash") || !item.image)) {
      updated = true;
      return { ...item, image: "/grandson_birthday.svg" };
    }
    return item;
  });
  if (updated) {
    safeSet(KEYS.MEMORY_ALBUM, all);
  }

  if (!patientId) return all;
  return all.filter((item) => item.patientId === patientId);
}

export function saveMemoryAlbumItem(item: MemoryAlbumItem): void {
  const all = getMemoryAlbum();
  const index = all.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    all[index] = item;
  } else {
    all.push(item);
  }
  safeSet(KEYS.MEMORY_ALBUM, all);
}

export function deleteMemoryAlbumItem(id: string): void {
  const all = getMemoryAlbum().filter((i) => i.id !== id);
  safeSet(KEYS.MEMORY_ALBUM, all);
}

// Caregiver Notes API
export function getCaregiverNotes(patientId?: string): CaregiverNote[] {
  const all = safeGet<CaregiverNote[]>(KEYS.NOTES, initialCaregiverNotes);
  if (!patientId) return all;
  return all.filter((n) => n.patientId === patientId);
}

export function saveCaregiverNote(note: CaregiverNote): void {
  const all = getCaregiverNotes();
  all.unshift(note);
  safeSet(KEYS.NOTES, all);
}

// Alerts API
export function getAlerts(patientId?: string): AlertItem[] {
  const all = safeGet<AlertItem[]>(KEYS.ALERTS, initialAlerts);
  if (!patientId) return all;
  return all.filter((a) => a.patientId === patientId);
}

export function addAlert(alert: AlertItem): void {
  const all = getAlerts();
  all.unshift(alert);
  safeSet(KEYS.ALERTS, all);
}

export function resolveAlert(id: string): void {
  const all = getAlerts();
  const item = all.find((a) => a.id === id);
  if (item) {
    item.resolved = true;
    safeSet(KEYS.ALERTS, all);
  }
}

// Memories Timeline API
export function getMemoriesTimeline(patientId?: string): MemoryLaneMemory[] {
  const all = safeGet<MemoryLaneMemory[]>(KEYS.MEMORIES_TIMELINE, initialMemoriesTimeline);
  if (!patientId) return all;
  return all.filter((m) => m.patientId === patientId);
}

export function saveTimelineMemory(memory: MemoryLaneMemory): void {
  const all = getMemoriesTimeline();
  all.unshift(memory);
  safeSet(KEYS.MEMORIES_TIMELINE, all);
}

// Game Sessions API
export function getGameSessions(patientId?: string): GameSession[] {
  const all = safeGet<GameSession[]>(KEYS.GAME_SESSIONS, initialGameSessions);
  if (!patientId) return all;
  return all.filter((gs) => gs.patientId === patientId);
}

export function saveGameSession(session: GameSession): void {
  const all = getGameSessions();
  const existingIndex = all.findIndex((s) => s.id === session.id);
  if (existingIndex >= 0) {
    all[existingIndex] = session;
    safeSet(KEYS.GAME_SESSIONS, all);
    return;
  }
  all.unshift(session);
  safeSet(KEYS.GAME_SESSIONS, all);
  updateDomainStats(session.patientId, session.domain, session.score);
}

// Domain Stats API
export function getDomainStats(patientId: string): DomainStats[] {
  const all = safeGet<DomainStats[]>(KEYS.DOMAIN_STATS, initialDomainStats);
  const filtered = all.filter((ds) => ds.patientId === patientId);
  if (filtered.length > 0) return filtered;

  const defaultDomains: CognitiveDomain[] = [
    "Memory & Attention",
    "Pattern Recognition & Attention",
    "Memory & Recall",
    "Recall",
    "Pattern Recognition"
  ];
  const newStats: DomainStats[] = defaultDomains.map((domain) => ({
    patientId,
    domain,
    runningAvg: 75,
    baseline: 70,
    history: [{ date: new Date().toISOString().split("T")[0], score: 75 }]
  }));

  safeSet(KEYS.DOMAIN_STATS, [...all, ...newStats]);
  return newStats;
}

export function updateDomainStats(
  patientId: string,
  domain: CognitiveDomain,
  newScore: number
): void {
  const all = safeGet<DomainStats[]>(KEYS.DOMAIN_STATS, initialDomainStats);
  let target = all.find((ds) => ds.patientId === patientId && ds.domain === domain);
  const today = new Date().toISOString().split("T")[0];

  if (!target) {
    target = {
      patientId,
      domain,
      runningAvg: newScore,
      baseline: newScore,
      history: [{ date: today, score: newScore }]
    };
    all.push(target);
  } else {
    target.runningAvg = Math.round(target.runningAvg * 0.7 + newScore * 0.3);
    target.history.push({ date: today, score: newScore });
    if (target.history.length > 30) {
      target.history = target.history.slice(-30);
    }
  }

  safeSet(KEYS.DOMAIN_STATS, all);
}

// Accessibility Settings API
export function getAccessibilitySettings(): AccessibilitySettings {
  return safeGet<AccessibilitySettings>(KEYS.ACCESSIBILITY, {
    fontSize: "normal",
    highContrast: false,
    voiceAssistance: true,
    reducedMotion: false,
    speechGender: "female"
  });
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  safeSet(KEYS.ACCESSIBILITY, settings);
  applyAccessibilityClasses(settings);
}

export function applyAccessibilityClasses(settings: AccessibilitySettings): void {
  if (typeof document === "undefined") return;

  const root = document.body;
  root.classList.remove("text-large", "text-extralarge", "high-contrast", "reduced-motion");

  if (settings.fontSize === "large") {
    root.classList.add("text-large");
  } else if (settings.fontSize === "extralarge") {
    root.classList.add("text-extralarge");
  }

  if (settings.highContrast) {
    root.classList.add("high-contrast");
  }

  if (settings.reducedMotion) {
    root.classList.add("reduced-motion");
  }
}

// Reset data helper
export function resetToInitialData(): void {
  safeSet(KEYS.PATIENTS, initialPatients);
  safeSet(KEYS.CARETAKERS, initialCaretakers);
  safeSet(KEYS.DOCTORS, initialDoctors);
  safeSet(KEYS.REMINDERS, initialReminders);
  safeSet(KEYS.WATER_EVENTS, initialWaterEvents);
  safeSet(KEYS.PRESCRIPTIONS, initialPrescriptions);
  safeSet(KEYS.MEMORY_ALBUM, initialMemoryAlbum);
  safeSet(KEYS.NOTES, initialCaregiverNotes);
  safeSet(KEYS.ALERTS, initialAlerts);
  safeSet(KEYS.MEMORIES_TIMELINE, initialMemoriesTimeline);
  safeSet(KEYS.GAME_SESSIONS, initialGameSessions);
  safeSet(KEYS.DOMAIN_STATS, initialDomainStats);
  safeSet(KEYS.REGISTERED_ACCOUNTS, []);
  clearOnboardingDraft();
  setSelectedPatientId("p1");
}
