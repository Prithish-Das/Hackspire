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

export type DifficultyLevel = "beginner" | "moderate" | "advanced";

export interface Patient {
  id: string;
  name: string;
  age: number;
  birthYear: number;
  region: string;
  language: Language;
  interests: string[];
  caretakerId: string;
  doctorIds: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  avatar?: string;
  baselineScore?: number;
}

export interface Caretaker {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  patientId?: string;
  caretakerId?: string;
  doctorId?: string;
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

export interface Reminder {
  id: string;
  patientId: string;
  type: ReminderType;
  title: string;
  time: string; // e.g. "08:00"
  status: ReminderStatus;
  snoozedUntil?: string;
  createdBy: string;
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
