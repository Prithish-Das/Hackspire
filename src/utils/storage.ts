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
  ReminderStatus
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
const CURRENT_VERSION = "2.0";

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
  ACCESSIBILITY: "recalled_accessibility"
};

// Safe JSON Parse helper
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

// Safe JSON Set helper
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Migration & Bootstrap initialization
export function initializeStorage(): void {
  const version = localStorage.getItem(STORAGE_VERSION_KEY);

  // If no version or older version, initialize data while keeping user's custom records if valid
  if (!version || version !== CURRENT_VERSION) {
    if (!localStorage.getItem(KEYS.PATIENTS)) {
      safeSet(KEYS.PATIENTS, initialPatients);
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

// Current User Management
export function getCurrentUser(): User | null {
  const user = safeGet<User | null>(KEYS.CURRENT_USER, null);
  if (!user) {
    // Default demo user: Patient Anand Sharma
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

// Patients API
export function getPatients(): Patient[] {
  return safeGet<Patient[]>(KEYS.PATIENTS, initialPatients);
}

export function getPatientById(id: string): Patient | undefined {
  const list = getPatients();
  return list.find((p) => p.id === id);
}

export function updatePatient(patient: Patient): void {
  const list = getPatients();
  const index = list.findIndex((p) => p.id === patient.id);
  if (index >= 0) {
    list[index] = patient;
  } else {
    list.push(patient);
  }
  safeSet(KEYS.PATIENTS, list);
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
    all.unshift(prescription); // newest first
  }
  safeSet(KEYS.PRESCRIPTIONS, all);
}

// Memory Album API (Feeds Game 3 & Caretaker Album)
export function getMemoryAlbum(patientId?: string): MemoryAlbumItem[] {
  let all = safeGet<MemoryAlbumItem[]>(KEYS.MEMORY_ALBUM, initialMemoryAlbum);
  // Auto-migrate ma-1 and ma-2 images if they point to the old unsplash links
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
  all.unshift(session);
  safeSet(KEYS.GAME_SESSIONS, all);
  updateDomainStats(session.patientId, session.domain, session.score);
}

// Domain Stats API
export function getDomainStats(patientId: string): DomainStats[] {
  const all = safeGet<DomainStats[]>(KEYS.DOMAIN_STATS, initialDomainStats);
  const filtered = all.filter((ds) => ds.patientId === patientId);
  if (filtered.length > 0) return filtered;

  // Initialize defaults for this patient if missing
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
    // Weighted moving average
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
  setSelectedPatientId("p1");
}
