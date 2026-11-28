export type Role = "patient" | "caretaker" | "doctor";

export type Language = "en" | "bn" | "hi";

export type CognitiveDomain =
  | "Memory & Attention"
  | "Pattern Recognition & Attention"
  | "Memory & Recall"
  | "Recall"
  | "Pattern Recognition";

export type GameId =
  | "memory_match"
  | "pattern_rhythm"
  | "family_recall"
  | "memory_lane"
  | "complete_the_pattern";

export type DifficultyLevel = "beginner" | "moderate" | "pro" | "advanced";

export interface PatientBasicInfo {
  fullName: string;
  age: number;
  city: string;
  state: string;
  preferredLanguage: Language;
}

export interface PrescriptionAttachmentMeta {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  recordedAt: string;
  storedInBrowser: false;
}

export interface PrescriptionMetadata {
  hasPrescription: boolean;
  doctorName?: string;
  prescriptionDate?: string;
  manualNotes?: string;
  attachmentMeta?: PrescriptionAttachmentMeta;
}

export interface PatientMedicalInfo {
  voluntaryConsentGiven: boolean;
  hasPriorAssessment: "yes" | "no" | "prefer_not_to_say" | "skipped";
  assessmentDetails?: string;
  prescription?: PrescriptionMetadata;
}

export interface FamilyMemberEntry {
  id: string;
  name: string;
  relationDetail?: string;
}

export interface PatientFamilyInfo {
  assistedByCaregiver?: boolean;
  allowInGames?: boolean;
  spouse?: {
    name: string;
    relationDetail?: string;
  };
  children: FamilyMemberEntry[];
  grandchildren: FamilyMemberEntry[];
}

export interface PatientInterests {
  sports: string[];
  entertainment: string[];
  lifestyle: string[];
  custom: string[];
}

export interface PatientDislikes {
  dislikedSportsOrTeams: string[];
  dislikedEntertainment: string[];
  uncomfortableTopics: string[];
  excludedPeopleOrSubjects: string[];
  otherExclusions: string[];
}

export interface Patient {
  id: string;
  userId?: string;
  inviteCode?: string;
  name: string;
  age: number;
  birthYear: number;
  region: string;
  city?: string;
  state?: string;
  language: Language;
  interests: string[];
  caretakerId: string;
  caretakerIds?: string[];
  doctorIds: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  avatar?: string;
  baselineScore?: number;
  onboardingCompleted?: boolean;
  basicInfo?: PatientBasicInfo;
  medicalInfo?: PatientMedicalInfo;
  familyInfo?: PatientFamilyInfo;
  structuredInterests?: PatientInterests;
  dislikes?: PatientDislikes;
  updatedAt?: string;
}

export interface PatientOnboardingDraft {
  step: number;
  email: string;
  basicInfo: {
    fullName: string;
    age: string;
    city: string;
    state: string;
    preferredLanguage: Language;
  };
  medicalInfo: PatientMedicalInfo;
  familyInfo: PatientFamilyInfo;
  structuredInterests: PatientInterests;
  dislikes: PatientDislikes;
  updatedAt: string;
}

export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  inviteCode?: string;
  profileImage?: string;
  patientId?: string;
  caretakerId?: string;
  doctorId?: string;
  createdAt: string;
}

export interface Caretaker {
  id: string;
  userId?: string;
  inviteCode?: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  relationshipLabel?: string;
  patientIds: string[];
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  clinic: string;
  patientIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileImage?: string;
  inviteCode?: string;
  patientId?: string;
  caretakerId?: string;
  doctorId?: string;
}

export type ConnectionRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderRole: Role;
  receiverRole: Role;
  senderName: string;
  receiverName: string;
  senderInviteCode?: string;
  receiverInviteCode?: string;
  senderProfileImage?: string;
  receiverProfileImage?: string;
  patientId?: string;
  caregiverId?: string;
  message?: string;
  status: ConnectionRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipStatus = "ACTIVE" | "DISCONNECTED";

export interface PatientCaregiverRelationship {
  id: string;
  patientId: string;
  caregiverId: string;
  patientUserId?: string;
  caregiverUserId?: string;
  connectedAt: string;
  disconnectedAt?: string;
  status: RelationshipStatus;
}

export interface ConnectionDirectoryProfile {
  userId: string;
  entityId: string;
  name: string;
  role: "patient" | "caretaker";
  inviteCode: string;
  profileImage?: string;
  age?: number;
  region?: string;
  relationshipLabel?: string;
  connectionStatus: "NONE" | "CONNECTED" | "PENDING_OUTGOING" | "PENDING_INCOMING";
  pendingRequestId?: string;
}

export interface ConnectedPatientSummary {
  patient: Patient;
  relationshipId: string;
  connectedAt: string;
  caregiverId: string;
  pendingRemindersCount: number;
  completedRemindersCount: number;
  latestActivity?: string;
  averageScore: number;
}

export interface ConnectedCaregiverSummary {
  caregiver: Caretaker;
  relationshipId: string;
  connectedAt: string;
}

export interface GameSession {
  id: string;
  patientId: string;
  gameId: GameId;
  domain: CognitiveDomain;
  score: number; // 0-100
  timeTaken: number; // seconds
  difficulty: DifficultyLevel;
  result: "completed" | "abandoned";
  date: string; // ISO date string
  accuracy?: number; // percentage 0-100
  attempts?: number;
  mistakes?: number;
}

export interface DomainStats {
  patientId: string;
  domain: CognitiveDomain;
  runningAvg: number;
  baseline: number;
  history: { date: string; score: number }[];
}

export type ReminderType = "medicine" | "water" | "meal" | "general";
export type ReminderStatus = "upcoming" | "taken" | "completed" | "missed" | "snoozed";

export type ReminderCategory =
  | "Medicine"
  | "Water Intake"
  | "Exercise"
  | "Daily Activity"
  | "Doctor Appointment"
  | "Custom Reminder";

export type RepeatFrequency = "none" | "daily" | "weekly" | "custom";

export interface Reminder {
  id: string;
  patientId: string;
  type: ReminderType;
  category?: ReminderCategory;
  title: string;
  description?: string;
  time: string; // e.g. "08:00"
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  repeatFrequency?: RepeatFrequency;
  customRepeatNote?: string;
  isActive?: boolean;
  status: ReminderStatus;
  snoozedUntil?: string;
  createdBy: string;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  notes?: string;
  mealType?: "breakfast" | "lunch" | "evening_snack" | "dinner";
  adherenceHistory?: {
    date: string;
    status: ReminderStatus;
    timestamp: string;
  }[];
}

export type WaterQuantity =
  | "small_amount"
  | "half_glass"
  | "one_glass"
  | "more_than_one_glass"
  | "not_sure";

export type WaterStatus =
  | "scheduled"
  | "reminder_sent"
  | "snoozed"
  | "patient_acknowledged"
  | "patient_reported_drinking"
  | "unacknowledged"
  | "missed"
  | "physically_verified";

export interface WaterEvent {
  id: string;
  reminderId?: string;
  patientId: string;
  scheduledAt: string; // ISO string or "HH:mm"
  confirmedAt?: string;
  status: WaterStatus;
  selfReportedQty?: WaterQuantity;
  verificationSource: "self-report" | "device";
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  clinicName?: string;
  date: string; // ISO date
  medicines: PrescriptionMedicine[];
  notes: string;
  addedToSchedule: boolean;
}

export type AlbumCategory =
  | "family"
  | "places"
  | "events"
  | "childhood"
  | "work_life"
  | "interests";

export interface MemoryAlbumItem {
  id: string;
  patientId: string;
  category: AlbumCategory;
  title: string;
  image: string; // URL, SVG, or data URI
  person?: string;
  relationship?: string;
  year?: string;
  description?: string;
  enabledForGame: boolean;
}

export interface CaregiverNote {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  text: string;
  date: string;
  mood?: string;
}

export interface AlertItem {
  id: string;
  patientId: string;
  type: "medicine" | "water" | "meal" | "activity" | "general";
  severity: "info" | "warning";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface MemoryLaneMemory {
  id: string;
  patientId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  culturalCategory: string;
  image?: string;
}

export interface AccessibilitySettings {
  fontSize: "normal" | "large" | "extralarge";
  highContrast: boolean;
  voiceAssistance: boolean;
  reducedMotion: boolean;
  speechGender: "female" | "male";
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}
