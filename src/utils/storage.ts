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
  PatientDislikes,
  ConnectionRequest,
  PatientCaregiverRelationship,
  ReminderCategory,
  ReminderType,
  ConnectedCaregiverSummary,
  ConnectedPatientSummary
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
  initialDomainStats,
  initialRelationships,
  initialConnectionRequests
} from "../data/initialData";

const STORAGE_VERSION_KEY = "recalled_storage_version";
const CURRENT_VERSION = "2.2";

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
  ONBOARDING_DRAFT: "recalled_onboarding_draft",
  CONNECTION_REQUESTS: "recalled_connection_requests",
  RELATIONSHIPS: "recalled_relationships"
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
    userId: raw.userId || (raw.id.startsWith("p") ? `u-patient-${raw.id.replace(/^p-?/, "")}` : `u-${raw.id}`),
    inviteCode: raw.inviteCode || `PAT-${raw.id.toUpperCase()}`,
    city: derivedCity,
    state: derivedState,
    region:
      raw.region ||
      [derivedCity, derivedState].filter(Boolean).join(", ") ||
      "India",
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    doctorIds: Array.isArray(raw.doctorIds) ? raw.doctorIds : ["d1"],
    caretakerId: raw.caretakerId !== undefined ? raw.caretakerId : "",
    caretakerIds: Array.isArray(raw.caretakerIds)
      ? raw.caretakerIds
      : raw.caretakerId
      ? [raw.caretakerId]
      : [],
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

function mergeMissingById<T extends { id: string }>(existing: T[], seeds: T[]): T[] {
  const existingIds = new Set(existing.map((item) => item.id));
  const missing = seeds.filter((item) => !existingIds.has(item.id));
  return [...existing, ...missing];
}

export function getReminderCategory(reminder: Partial<Reminder>): ReminderCategory {
  if (reminder.category) return reminder.category;
  if (reminder.type === "medicine") return "Medicine";
  if (reminder.type === "water") return "Water Intake";
  if (reminder.type === "meal") return "Daily Activity";
  return "Custom Reminder";
}

export function categoryToReminderType(category: ReminderCategory): ReminderType {
  if (category === "Medicine") return "medicine";
  if (category === "Water Intake") return "water";
  if (category === "Daily Activity") return "meal";
  return "general";
}

export function normalizeReminderRecord(raw: Reminder): Reminder {
  const today = new Date().toISOString().split("T")[0];
  const scheduledTime = raw.scheduledTime || raw.time || "09:00";
  const category = getReminderCategory(raw);
  const type = raw.type || categoryToReminderType(category);
  const description = raw.description ?? raw.notes ?? raw.instructions ?? "";

  return {
    ...raw,
    type,
    category,
    time: scheduledTime,
    scheduledTime,
    scheduledDate: raw.scheduledDate || today,
    description,
    notes: raw.notes ?? description,
    repeatFrequency: raw.repeatFrequency || "daily",
    isActive: raw.isActive !== undefined ? raw.isActive : true,
    completedAt: raw.completedAt !== undefined ? raw.completedAt : null,
    createdAt: raw.createdAt || "2026-10-01T08:00:00.000Z",
    updatedAt: raw.updatedAt || raw.createdAt || "2026-10-01T08:00:00.000Z"
  };
}

export function isReminderCompleted(reminder: Reminder): boolean {
  return reminder.status === "completed" || reminder.status === "taken";
}

export function isReminderOverdue(reminder: Reminder): boolean {
  if (reminder.isActive === false) return false;
  if (isReminderCompleted(reminder)) return false;
  if (reminder.status === "missed") return true;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const remDate = reminder.scheduledDate || today;
  const remTime = reminder.scheduledTime || reminder.time || "23:59";

  if (remDate < today) return true;
  if (remDate > today) return false;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return remTime < `${hh}:${mm}`;
}

// Migration & Bootstrap initialization
export function initializeStorage(): void {
  const version = localStorage.getItem(STORAGE_VERSION_KEY);

  if (!version || version !== CURRENT_VERSION) {
    if (!localStorage.getItem(KEYS.PATIENTS)) {
      safeSet(KEYS.PATIENTS, initialPatients.map(normalizePatientRecord));
    } else {
      const existing = safeGet<Patient[]>(KEYS.PATIENTS, initialPatients).map(normalizePatientRecord);
      safeSet(KEYS.PATIENTS, mergeMissingById(existing, initialPatients.map(normalizePatientRecord)));
    }
    if (!localStorage.getItem(KEYS.CARETAKERS)) {
      safeSet(KEYS.CARETAKERS, initialCaretakers);
    } else {
      const existing = safeGet<Caretaker[]>(KEYS.CARETAKERS, initialCaretakers);
      const merged = mergeMissingById(existing, initialCaretakers).map((c) => {
        const seed = initialCaretakers.find((s) => s.id === c.id);
        return {
          ...c,
          userId: c.userId || seed?.userId || `u-${c.id}`,
          inviteCode: c.inviteCode || seed?.inviteCode || `CARE-${c.id.toUpperCase()}`,
          relationshipLabel: c.relationshipLabel || seed?.relationshipLabel
        };
      });
      safeSet(KEYS.CARETAKERS, merged);
    }
    if (!localStorage.getItem(KEYS.DOCTORS)) {
      safeSet(KEYS.DOCTORS, initialDoctors);
    }
    if (!localStorage.getItem(KEYS.REMINDERS)) {
      safeSet(KEYS.REMINDERS, initialReminders.map(normalizeReminderRecord));
    } else {
      const existing = safeGet<Reminder[]>(KEYS.REMINDERS, initialReminders).map(normalizeReminderRecord);
      safeSet(KEYS.REMINDERS, mergeMissingById(existing, initialReminders.map(normalizeReminderRecord)));
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
    } else {
      const existing = safeGet<CaregiverNote[]>(KEYS.NOTES, initialCaregiverNotes);
      safeSet(KEYS.NOTES, mergeMissingById(existing, initialCaregiverNotes));
    }
    if (!localStorage.getItem(KEYS.ALERTS)) {
      safeSet(KEYS.ALERTS, initialAlerts);
    } else {
      const existing = safeGet<AlertItem[]>(KEYS.ALERTS, initialAlerts);
      safeSet(KEYS.ALERTS, mergeMissingById(existing, initialAlerts));
    }
    if (!localStorage.getItem(KEYS.MEMORIES_TIMELINE)) {
      safeSet(KEYS.MEMORIES_TIMELINE, initialMemoriesTimeline);
    }
    if (!localStorage.getItem(KEYS.GAME_SESSIONS)) {
      safeSet(KEYS.GAME_SESSIONS, initialGameSessions);
    } else {
      const existing = safeGet<GameSession[]>(KEYS.GAME_SESSIONS, initialGameSessions);
      safeSet(KEYS.GAME_SESSIONS, mergeMissingById(existing, initialGameSessions));
    }
    if (!localStorage.getItem(KEYS.DOMAIN_STATS)) {
      safeSet(KEYS.DOMAIN_STATS, initialDomainStats);
    } else {
      const existing = safeGet<DomainStats[]>(KEYS.DOMAIN_STATS, initialDomainStats);
      const missing = initialDomainStats.filter(
        (s) => !existing.some((e) => e.patientId === s.patientId && e.domain === s.domain)
      );
      if (missing.length > 0) {
        safeSet(KEYS.DOMAIN_STATS, [...existing, ...missing]);
      }
    }
    if (!localStorage.getItem(KEYS.RELATIONSHIPS)) {
      safeSet(KEYS.RELATIONSHIPS, initialRelationships);
    }
    if (!localStorage.getItem(KEYS.CONNECTION_REQUESTS)) {
      safeSet(KEYS.CONNECTION_REQUESTS, initialConnectionRequests);
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
  inviteCode?: string;
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

  const id = `u-${params.role}-${Date.now()}`;
  const generatedInviteCode =
    params.inviteCode ||
    (params.role === "patient"
      ? `PAT-${(params.patientId || id).replace(/^p-?/, "").toUpperCase().slice(0, 8)}`
      : params.role === "caretaker"
      ? `CARE-${(params.caretakerId || id).replace(/^c-?/, "").toUpperCase().slice(0, 8)}`
      : undefined);

  const account: RegisteredAccount = {
    id,
    name: params.name.trim(),
    email: normEmail,
    passwordHash: hashPrototypeCredential(params.password),
    role: params.role,
    inviteCode: generatedInviteCode,
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
    inviteCode: match.inviteCode,
    profileImage: match.profileImage,
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
      id: "u-patient-1",
      name: "Anand Sharma",
      email: "anand.sharma@example.com",
      role: "patient",
      inviteCode: "PAT-ANAND-P1",
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
  return safeGet<Caretaker[]>(KEYS.CARETAKERS, initialCaretakers).map((c) => ({
    ...c,
    userId: c.userId || `u-${c.id}`,
    inviteCode: c.inviteCode || `CARE-${c.id.toUpperCase()}`,
    patientIds: Array.isArray(c.patientIds) ? c.patientIds : []
  }));
}

export function saveCaretaker(caretaker: Caretaker): void {
  const all = getCaretakers();
  const normalized: Caretaker = {
    ...caretaker,
    userId: caretaker.userId || `u-${caretaker.id}`,
    inviteCode: caretaker.inviteCode || `CARE-${caretaker.id.toUpperCase()}`,
    patientIds: Array.isArray(caretaker.patientIds) ? caretaker.patientIds : []
  };
  const idx = all.findIndex((c) => c.id === normalized.id);
  if (idx >= 0) {
    all[idx] = normalized;
  } else {
    all.push(normalized);
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

  // If the patient has an explicit caretakerId, ensure the relationship & roster include them
  if (normalized.caretakerId) {
    syncRelationshipToEntities(normalized.id, normalized.caretakerId, "connect");
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

// Connection Requests & Patient-Caregiver Relationships API
export function getConnectionRequests(): ConnectionRequest[] {
  return safeGet<ConnectionRequest[]>(KEYS.CONNECTION_REQUESTS, initialConnectionRequests);
}

export function saveConnectionRequests(requests: ConnectionRequest[]): void {
  safeSet(KEYS.CONNECTION_REQUESTS, requests);
}

export function getRelationships(): PatientCaregiverRelationship[] {
  return safeGet<PatientCaregiverRelationship[]>(KEYS.RELATIONSHIPS, initialRelationships);
}

export function saveRelationships(relationships: PatientCaregiverRelationship[]): void {
  safeSet(KEYS.RELATIONSHIPS, relationships);
}

export function syncRelationshipToEntities(
  patientId: string,
  caregiverId: string,
  action: "connect" | "disconnect"
): PatientCaregiverRelationship | null {
  const relationships = getRelationships();
  const patients = getPatients();
  const caretakers = getCaretakers();

  const patient = patients.find((p) => p.id === patientId);
  const caretaker = caretakers.find((c) => c.id === caregiverId);

  const now = new Date().toISOString();
  let rel = relationships.find(
    (r) => r.patientId === patientId && r.caregiverId === caregiverId
  );

  if (action === "connect") {
    if (rel) {
      rel = {
        ...rel,
        status: "ACTIVE",
        connectedAt: now,
        disconnectedAt: undefined
      };
      saveRelationships(relationships.map((r) => (r.id === rel!.id ? rel! : r)));
    } else {
      rel = {
        id: `rel-${caregiverId}-${patientId}`,
        patientId,
        caregiverId,
        patientUserId: patient?.userId,
        caregiverUserId: caretaker?.userId,
        connectedAt: now,
        status: "ACTIVE"
      };
      saveRelationships([...relationships, rel]);
    }

    if (caretaker && !caretaker.patientIds.includes(patientId)) {
      saveCaretaker({ ...caretaker, patientIds: [...caretaker.patientIds, patientId] });
    }
    if (patient) {
      const nextCaretakerIds = Array.from(
        new Set([...(patient.caretakerIds || []), caregiverId])
      );
      updatePatient({
        ...patient,
        caretakerId: patient.caretakerId || caregiverId,
        caretakerIds: nextCaretakerIds
      });
    }
    return rel;
  } else {
    if (rel) {
      rel = {
        ...rel,
        status: "DISCONNECTED",
        disconnectedAt: now
      };
      saveRelationships(relationships.map((r) => (r.id === rel!.id ? rel! : r)));
    }
    if (caretaker) {
      saveCaretaker({
        ...caretaker,
        patientIds: caretaker.patientIds.filter((pid) => pid !== patientId)
      });
    }
    if (patient) {
      const nextCaretakerIds = (patient.caretakerIds || []).filter((cid) => cid !== caregiverId);
      const nextPrimary =
        patient.caretakerId === caregiverId ? nextCaretakerIds[0] || "" : patient.caretakerId;
      updatePatient({
        ...patient,
        caretakerId: nextPrimary,
        caretakerIds: nextCaretakerIds
      });
    }
    return rel || null;
  }
}

export function getConnectedCaregiversForPatient(patientId: string): ConnectedCaregiverSummary[] {
  const relationships = getRelationships().filter(
    (r) => r.patientId === patientId && r.status === "ACTIVE"
  );
  const caretakers = getCaretakers();
  return relationships
    .map((rel) => {
      const caregiver = caretakers.find((c) => c.id === rel.caregiverId);
      if (!caregiver) return null;
      return {
        caregiver,
        relationshipId: rel.id,
        connectedAt: rel.connectedAt
      };
    })
    .filter((item): item is ConnectedCaregiverSummary => Boolean(item));
}

export function getConnectedPatientSummariesForCaregiver(
  caregiverId: string
): ConnectedPatientSummary[] {
  const relationships = getRelationships().filter(
    (r) => r.caregiverId === caregiverId && r.status === "ACTIVE"
  );
  const patients = getPatients();
  const allReminders = getReminders();
  const allSessions = getGameSessions();

  return relationships
    .map((rel): ConnectedPatientSummary | null => {
      const patient = patients.find((p) => p.id === rel.patientId);
      if (!patient) return null;

      const pReminders = allReminders.filter(
        (r) => r.patientId === patient.id && r.isActive !== false
      );
      const pendingRemindersCount = pReminders.filter((r) => !isReminderCompleted(r)).length;
      const completedRemindersCount = pReminders.filter((r) => isReminderCompleted(r)).length;

      const pSessions = allSessions
        .filter((s) => s.patientId === patient.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      const latestSession = pSessions[0];
      const latestActivity = latestSession
        ? `${latestSession.gameId.replace(/_/g, " ")} (${latestSession.score}%)`
        : undefined;

      const stats = getDomainStats(patient.id);
      const averageScore =
        stats.length > 0
          ? Math.round(stats.reduce((sum, s) => sum + s.runningAvg, 0) / stats.length)
          : patient.baselineScore ?? 75;

      return {
        patient,
        relationshipId: rel.id,
        connectedAt: rel.connectedAt,
        caregiverId,
        pendingRemindersCount,
        completedRemindersCount,
        latestActivity,
        averageScore
      };
    })
    .filter((item): item is ConnectedPatientSummary => item !== null);
}

/**
 * Role-based patient access control:
 * - Patient: ONLY their own patientId (never unrelated patients)
 * - Caretaker: ONLY patients with an ACTIVE relationship (or matching roster when no disconnected relationship overrides)
 * - Doctor: ONLY patients assigned to their doctorId / patientIds
 */
export function getAccessiblePatientsForUser(user: User | null): Patient[] {
  if (!user) return [];
  const all = getPatients();

  if (user.role === "patient") {
    return user.patientId ? all.filter((p) => p.id === user.patientId) : [];
  }

  if (user.role === "caretaker") {
    if (!user.caretakerId) return [];
    const relationships = getRelationships();
    const activeRelPatientIds = new Set(
      relationships
        .filter((r) => r.caregiverId === user.caretakerId && r.status === "ACTIVE")
        .map((r) => r.patientId)
    );
    const disconnectedRelPatientIds = new Set(
      relationships
        .filter((r) => r.caregiverId === user.caretakerId && r.status === "DISCONNECTED")
        .map((r) => r.patientId)
    );
    const caretaker = getCaretakers().find((c) => c.id === user.caretakerId);

    return all.filter((p) => {
      if (activeRelPatientIds.has(p.id)) return true;
      if (disconnectedRelPatientIds.has(p.id)) return false;
      return (
        p.caretakerId === user.caretakerId ||
        (Array.isArray(p.caretakerIds) && p.caretakerIds.includes(user.caretakerId!)) ||
        (caretaker ? caretaker.patientIds.includes(p.id) : false)
      );
    });
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
  const all = safeGet<Reminder[]>(KEYS.REMINDERS, initialReminders).map(normalizeReminderRecord);
  if (!patientId) return all;
  return all.filter((r) => r.patientId === patientId);
}

export function replacePatientReminders(patientId: string, patientReminders: Reminder[]): void {
  const others = getReminders().filter((r) => r.patientId !== patientId);
  const normalized = patientReminders.map(normalizeReminderRecord);
  safeSet(KEYS.REMINDERS, [...others, ...normalized]);
}

export function saveReminder(reminder: Reminder): Reminder {
  const all = getReminders();
  const now = new Date().toISOString();
  const normalized = normalizeReminderRecord({
    ...reminder,
    createdAt: reminder.createdAt || now,
    updatedAt: now
  });
  const index = all.findIndex((r) => r.id === normalized.id);
  if (index >= 0) {
    all[index] = normalized;
  } else {
    all.push(normalized);
  }
  safeSet(KEYS.REMINDERS, all);
  return normalized;
}

export function updateReminderStatus(
  id: string,
  status: ReminderStatus,
  options?: { snoozedUntil?: string; note?: string }
): Reminder | null {
  const all = getReminders();
  const target = all.find((r) => r.id === id);
  if (!target) return null;

  const now = new Date().toISOString();
  target.status = status;
  target.updatedAt = now;
  if (status === "completed" || status === "taken") {
    target.completedAt = now;
  } else if (status === "upcoming") {
    target.completedAt = null;
  }
  if (options?.snoozedUntil) {
    target.snoozedUntil = options.snoozedUntil;
  }
  if (!target.adherenceHistory) {
    target.adherenceHistory = [];
  }
  target.adherenceHistory.push({
    date: now.split("T")[0],
    status,
    timestamp: now
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
  safeSet(KEYS.RELATIONSHIPS, initialRelationships);
  safeSet(KEYS.CONNECTION_REQUESTS, initialConnectionRequests);
  safeSet(KEYS.REGISTERED_ACCOUNTS, []);
  clearOnboardingDraft();
  setSelectedPatientId("p1");
}
