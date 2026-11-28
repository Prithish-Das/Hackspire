import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Domain & Adaptive Configuration ---
const DOMAIN_TO_GAME_MAP: Record<string, string> = {
  "Memory & Attention": "memory_match",
  "Pattern Recognition & Attention": "pattern_rhythm",
  "Memory & Recall": "family_recall",
  Recall: "memory_lane",
  "Pattern Recognition": "complete_the_pattern",
};

const VALID_DIFFICULTIES = ["beginner", "moderate", "advanced", "pro"] as const;
const VALID_GAMES = Object.values(DOMAIN_TO_GAME_MAP);
const VALID_DOMAINS = Object.keys(DOMAIN_TO_GAME_MAP);
const SUPPORTED_LANGUAGES = new Set(["en", "bn", "hi"]);

type Role = "patient" | "caretaker" | "doctor";
type ConnectionRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
type RelationshipStatus = "ACTIVE" | "DISCONNECTED";
type ReminderCategory =
  | "Medicine"
  | "Water Intake"
  | "Exercise"
  | "Daily Activity"
  | "Doctor Appointment"
  | "Custom Reminder";
type RepeatFrequency = "none" | "daily" | "weekly" | "custom";
type ReminderType = "medicine" | "water" | "meal" | "general";
type ReminderStatus = "upcoming" | "taken" | "completed" | "missed" | "snoozed";

interface PatientRecord {
  id: string;
  userId?: string;
  inviteCode?: string;
  name: string;
  age: number;
  birthYear: number;
  region: string;
  language: string;
  baselineScore: number;
  caretakerId?: string;
  caretakerIds?: string[];
}

interface CaretakerRecord {
  id: string;
  userId: string;
  inviteCode: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  relationshipLabel?: string;
  patientIds: string[];
}

interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  inviteCode?: string;
  profileImage?: string;
  patientId?: string;
  caretakerId?: string;
  doctorId?: string;
  passwordHash?: string;
  passwordSalt?: string;
}

interface ConnectionRequestRecord {
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

interface RelationshipRecord {
  id: string;
  patientId: string;
  caregiverId: string;
  patientUserId?: string;
  caregiverUserId?: string;
  connectedAt: string;
  disconnectedAt?: string;
  status: RelationshipStatus;
}

interface ReminderRecord {
  id: string;
  patientId: string;
  type: ReminderType;
  category: ReminderCategory;
  title: string;
  description: string;
  time: string;
  scheduledDate: string;
  scheduledTime: string;
  repeatFrequency: RepeatFrequency;
  customRepeatNote?: string;
  isActive: boolean;
  status: ReminderStatus;
  snoozedUntil?: string;
  createdBy: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

interface DomainStatRecord {
  patientId: string;
  domain: string;
  runningAvg: number;
  baseline: number;
  updatedAt: string;
}

interface GameSessionRecord {
  id: string;
  patientId: string;
  gameId: string;
  domain: string;
  score: number;
  timeTaken: number;
  difficulty: string;
  result: string;
  date: string;
  accuracy?: number;
  attempts?: number;
  mistakes?: number;
}

// --- In-Memory Seed Store ---
const patients = new Map<string, PatientRecord>([
  [
    "p1",
    {
      id: "p1",
      userId: "u-patient-1",
      inviteCode: "PAT-ANAND-P1",
      name: "Anand Sharma",
      age: 74,
      birthYear: 1952,
      region: "Kolkata, West Bengal",
      language: "en",
      baselineScore: 78,
      caretakerId: "c1",
      caretakerIds: ["c1"],
    },
  ],
  [
    "p2",
    {
      id: "p2",
      userId: "u-patient-2",
      inviteCode: "PAT-SAVITRI-P2",
      name: "Savitri Devi",
      age: 71,
      birthYear: 1955,
      region: "Kolkata, West Bengal",
      language: "bn",
      baselineScore: 72,
      caretakerId: "c1",
      caretakerIds: ["c1"],
    },
  ],
  [
    "p3",
    {
      id: "p3",
      userId: "u-patient-3",
      inviteCode: "PAT-RAMESH-P3",
      name: "Dr. Ramesh Roy",
      age: 79,
      birthYear: 1947,
      region: "Kolkata, West Bengal",
      language: "bn",
      baselineScore: 84,
      caretakerId: "c1",
      caretakerIds: ["c1"],
    },
  ],
  [
    "p4",
    {
      id: "p4",
      userId: "u-patient-4",
      inviteCode: "PAT-MEERA-P4",
      name: "Meera Krishnan",
      age: 76,
      birthYear: 1950,
      region: "Bengaluru, Karnataka",
      language: "en",
      baselineScore: 76,
      caretakerId: "",
      caretakerIds: [],
    },
  ],
  [
    "p5",
    {
      id: "p5",
      userId: "u-patient-5",
      inviteCode: "PAT-HARISH-P5",
      name: "Harish Patel",
      age: 69,
      birthYear: 1957,
      region: "Ahmedabad, Gujarat",
      language: "hi",
      baselineScore: 81,
      caretakerId: "",
      caretakerIds: [],
    },
  ],
]);

const caretakers = new Map<string, CaretakerRecord>([
  [
    "c1",
    {
      id: "c1",
      userId: "u-caretaker-1",
      inviteCode: "CARE-PRIYA-C1",
      name: "Priya Sharma",
      email: "priya.sharma@care.org",
      phone: "+91 98765 43210",
      relationshipLabel: "Daughter & Family Caregiver",
      patientIds: ["p1", "p2", "p3"],
    },
  ],
  [
    "c2",
    {
      id: "c2",
      userId: "u-caretaker-2",
      inviteCode: "CARE-RAHUL-C2",
      name: "Rahul Verma",
      email: "rahul.verma@care.org",
      phone: "+91 98111 22334",
      relationshipLabel: "Family Caregiver",
      patientIds: [],
    },
  ],
]);

const serverUsers = new Map<string, ServerUserRecord>([
  [
    "u-patient-1",
    {
      id: "u-patient-1",
      name: "Anand Sharma",
      email: "anand.sharma@example.com",
      role: "patient",
      inviteCode: "PAT-ANAND-P1",
      patientId: "p1",
    },
  ],
  [
    "u-patient-2",
    {
      id: "u-patient-2",
      name: "Savitri Devi",
      email: "savitri.devi@example.com",
      role: "patient",
      inviteCode: "PAT-SAVITRI-P2",
      patientId: "p2",
    },
  ],
  [
    "u-patient-3",
    {
      id: "u-patient-3",
      name: "Dr. Ramesh Roy",
      email: "ramesh.roy@example.com",
      role: "patient",
      inviteCode: "PAT-RAMESH-P3",
      patientId: "p3",
    },
  ],
  [
    "u-patient-4",
    {
      id: "u-patient-4",
      name: "Meera Krishnan",
      email: "meera.krishnan@example.com",
      role: "patient",
      inviteCode: "PAT-MEERA-P4",
      patientId: "p4",
    },
  ],
  [
    "u-patient-5",
    {
      id: "u-patient-5",
      name: "Harish Patel",
      email: "harish.patel@example.com",
      role: "patient",
      inviteCode: "PAT-HARISH-P5",
      patientId: "p5",
    },
  ],
  [
    "u-caretaker-1",
    {
      id: "u-caretaker-1",
      name: "Priya Sharma",
      email: "priya.sharma@care.org",
      role: "caretaker",
      inviteCode: "CARE-PRIYA-C1",
      caretakerId: "c1",
    },
  ],
  [
    "u-caretaker-2",
    {
      id: "u-caretaker-2",
      name: "Rahul Verma",
      email: "rahul.verma@care.org",
      role: "caretaker",
      inviteCode: "CARE-RAHUL-C2",
      caretakerId: "c2",
    },
  ],
  [
    "u-doctor-1",
    {
      id: "u-doctor-1",
      name: "Dr. Arvind Mukherjee",
      email: "dr.mukherjee@cityneuro.org",
      role: "doctor",
      doctorId: "d1",
    },
  ],
]);

const authSessions = new Map<string, string>(); // token -> userId

const relationships: RelationshipRecord[] = [
  {
    id: "rel-c1-p1",
    patientId: "p1",
    caregiverId: "c1",
    patientUserId: "u-patient-1",
    caregiverUserId: "u-caretaker-1",
    connectedAt: "2026-09-01T09:00:00.000Z",
    status: "ACTIVE",
  },
  {
    id: "rel-c1-p2",
    patientId: "p2",
    caregiverId: "c1",
    patientUserId: "u-patient-2",
    caregiverUserId: "u-caretaker-1",
    connectedAt: "2026-09-05T10:30:00.000Z",
    status: "ACTIVE",
  },
  {
    id: "rel-c1-p3",
    patientId: "p3",
    caregiverId: "c1",
    patientUserId: "u-patient-3",
    caregiverUserId: "u-caretaker-1",
    connectedAt: "2026-09-10T14:15:00.000Z",
    status: "ACTIVE",
  },
];

const connectionRequests: ConnectionRequestRecord[] = [
  {
    id: "creq-1",
    senderId: "u-patient-4",
    receiverId: "u-caretaker-1",
    senderRole: "patient",
    receiverRole: "caretaker",
    senderName: "Meera Krishnan",
    receiverName: "Priya Sharma",
    senderInviteCode: "PAT-MEERA-P4",
    receiverInviteCode: "CARE-PRIYA-C1",
    patientId: "p4",
    caregiverId: "c1",
    message: "Hello Priya, I would like to connect with you for my daily care reminders.",
    status: "PENDING",
    createdAt: "2026-11-27T08:30:00.000Z",
    updatedAt: "2026-11-27T08:30:00.000Z",
  },
  {
    id: "creq-2",
    senderId: "u-caretaker-2",
    receiverId: "u-patient-1",
    senderRole: "caretaker",
    receiverRole: "patient",
    senderName: "Rahul Verma",
    receiverName: "Anand Sharma",
    senderInviteCode: "CARE-RAHUL-C2",
    receiverInviteCode: "PAT-ANAND-P1",
    patientId: "p1",
    caregiverId: "c2",
    message: "Namaste Anand ji, I am Rahul and would love to help coordinate your evening walks.",
    status: "PENDING",
    createdAt: "2026-11-27T11:00:00.000Z",
    updatedAt: "2026-11-27T11:00:00.000Z",
  },
  {
    id: "creq-3",
    senderId: "u-caretaker-1",
    receiverId: "u-patient-5",
    senderRole: "caretaker",
    receiverRole: "patient",
    senderName: "Priya Sharma",
    receiverName: "Harish Patel",
    senderInviteCode: "CARE-PRIYA-C1",
    receiverInviteCode: "PAT-HARISH-P5",
    patientId: "p5",
    caregiverId: "c1",
    message: "Hello Harish ji, sending a care connection request to help manage your schedule.",
    status: "PENDING",
    createdAt: "2026-11-28T05:15:00.000Z",
    updatedAt: "2026-11-28T05:15:00.000Z",
  },
];

const TODAY_DATE = new Date().toISOString().split("T")[0];

const reminders: ReminderRecord[] = [
  {
    id: "rem-1",
    patientId: "p1",
    type: "medicine",
    category: "Medicine",
    title: "Amlodipine (Blood Pressure)",
    description: "Take after breakfast with water",
    time: "08:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "08:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "taken",
    dosage: "5 mg",
    frequency: "Once daily in the morning",
    instructions: "Take after breakfast with water",
    createdBy: "d1",
    completedAt: "2026-11-28T08:05:00.000Z",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-11-28T08:05:00.000Z",
    notes: "Prescribed for BP stabilization",
  },
  {
    id: "rem-2",
    patientId: "p1",
    type: "meal",
    category: "Daily Activity",
    title: "Morning Breakfast",
    description: "Oatmeal with almonds & papaya",
    time: "08:30",
    scheduledDate: TODAY_DATE,
    scheduledTime: "08:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "completed",
    mealType: "breakfast",
    createdBy: "c1",
    completedAt: "2026-11-28T08:45:00.000Z",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-11-28T08:45:00.000Z",
    notes: "Oatmeal with almonds & papaya",
  },
  {
    id: "rem-3",
    patientId: "p1",
    type: "water",
    category: "Water Intake",
    title: "Morning Hydration",
    description: "Patient reported drinking 1 glass",
    time: "10:30",
    scheduledDate: TODAY_DATE,
    scheduledTime: "10:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "taken",
    createdBy: "c1",
    completedAt: "2026-11-28T10:32:00.000Z",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-11-28T10:32:00.000Z",
    notes: "Patient reported drinking 1 glass",
  },
  {
    id: "rem-4",
    patientId: "p1",
    type: "meal",
    category: "Daily Activity",
    title: "Nutritious Lunch",
    description: "Rice, dal, seasonal vegetables",
    time: "13:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "13:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "completed",
    mealType: "lunch",
    createdBy: "c1",
    completedAt: "2026-11-28T13:20:00.000Z",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-11-28T13:20:00.000Z",
    notes: "Rice, dal, seasonal vegetables",
  },
  {
    id: "rem-5",
    patientId: "p1",
    type: "medicine",
    category: "Medicine",
    title: "Donepezil (Cognitive Support)",
    description: "Take with half glass of water",
    time: "14:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "14:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    dosage: "5 mg",
    frequency: "Once daily after lunch",
    instructions: "Take with half glass of water",
    createdBy: "d1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "Doctor prescribed cognitive support medication",
  },
  {
    id: "rem-6",
    patientId: "p1",
    type: "water",
    category: "Water Intake",
    title: "Afternoon Water",
    description: "Scheduled hydration prompt",
    time: "16:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "16:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    createdBy: "c1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "Scheduled hydration prompt",
  },
  {
    id: "rem-7",
    patientId: "p1",
    type: "meal",
    category: "Daily Activity",
    title: "Dinner",
    description: "Light dinner: rotis, paneer, warm milk",
    time: "20:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "20:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    mealType: "dinner",
    createdBy: "c1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "Light dinner: rotis, paneer, warm milk",
  },
  {
    id: "rem-8",
    patientId: "p1",
    type: "medicine",
    category: "Medicine",
    title: "Atorvastatin (Cholesterol)",
    description: "Take at bedtime",
    time: "21:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "21:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    dosage: "10 mg",
    frequency: "Once daily before sleep",
    instructions: "Take at bedtime",
    createdBy: "d1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "Bedtime lipid management",
  },
  {
    id: "rem-p2-1",
    patientId: "p2",
    type: "medicine",
    category: "Medicine",
    title: "Thyroxine 50mcg",
    description: "Take on an empty stomach 30 minutes before morning tea",
    time: "07:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "07:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "taken",
    dosage: "50 mcg",
    frequency: "Once daily",
    instructions: "Take with warm water before breakfast",
    createdBy: "c1",
    completedAt: "2026-11-28T07:05:00.000Z",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-11-28T07:05:00.000Z",
    notes: "Morning thyroid support",
  },
  {
    id: "rem-p2-2",
    patientId: "p2",
    type: "general",
    category: "Exercise",
    title: "Gentle Terrace Walk & Stretching",
    description: "15 minutes of slow walking and shoulder stretches in morning sunlight",
    time: "09:30",
    scheduledDate: TODAY_DATE,
    scheduledTime: "09:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    createdBy: "c1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "Wear comfortable walking shoes",
  },
  {
    id: "rem-p2-3",
    patientId: "p2",
    type: "water",
    category: "Water Intake",
    title: "Midday Hydration Check",
    description: "Drink one full glass of lukewarm water",
    time: "12:30",
    scheduledDate: TODAY_DATE,
    scheduledTime: "12:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    createdBy: "c1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "rem-p3-1",
    patientId: "p3",
    type: "medicine",
    category: "Medicine",
    title: "Metformin XR",
    description: "Take right after lunch with water",
    time: "13:30",
    scheduledDate: TODAY_DATE,
    scheduledTime: "13:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    dosage: "500 mg",
    createdBy: "c1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "After lunch blood sugar support",
  },
  {
    id: "rem-p3-2",
    patientId: "p3",
    type: "general",
    category: "Doctor Appointment",
    title: "Neurology Wellness Check-in",
    description: "Routine follow-up call with Dr. Arvind Mukherjee at Metropolitan Clinic",
    time: "17:00",
    scheduledDate: TODAY_DATE,
    scheduledTime: "17:00",
    repeatFrequency: "none",
    isActive: true,
    status: "upcoming",
    createdBy: "c1",
    completedAt: null,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    notes: "Keep recent memory log handy",
  },
  {
    id: "rem-p3-3",
    patientId: "p3",
    type: "general",
    category: "Daily Activity",
    title: "Evening Rabindra Sangeet & Reading",
    description: "Listen to favourite Tagore songs for 20 minutes",
    time: "18:30",
    scheduledDate: TODAY_DATE,
    scheduledTime: "18:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "completed",
    createdBy: "c1",
    completedAt: "2026-11-28T18:45:00.000Z",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-11-28T18:45:00.000Z",
  },
];

const domainStats = new Map<string, DomainStatRecord[]>();
const gameSessions: GameSessionRecord[] = [
  {
    id: "gs-1",
    patientId: "p1",
    gameId: "memory_match",
    domain: "Memory & Attention",
    score: 85,
    timeTaken: 72,
    difficulty: "moderate",
    result: "completed",
    date: "2026-10-01T11:00:00.000Z",
  },
  {
    id: "gs-p2-1",
    patientId: "p2",
    gameId: "memory_match",
    domain: "Memory & Attention",
    score: 74,
    timeTaken: 92,
    difficulty: "beginner",
    result: "completed",
    date: "2026-11-27T10:15:00.000Z",
  },
  {
    id: "gs-p3-1",
    patientId: "p3",
    gameId: "memory_lane",
    domain: "Recall",
    score: 92,
    timeTaken: 64,
    difficulty: "pro",
    result: "completed",
    date: "2026-11-27T16:10:00.000Z",
  },
];
const ttsAudioCache = new Map<string, Buffer>();

function seedDomainStats(patientId: string, base = 78): DomainStatRecord[] {
  const now = new Date().toISOString();
  const initial: DomainStatRecord[] = [
    { patientId, domain: "Memory & Attention", runningAvg: base + 4, baseline: base, updatedAt: now },
    { patientId, domain: "Pattern Recognition & Attention", runningAvg: base - 2, baseline: base - 4, updatedAt: now },
    { patientId, domain: "Memory & Recall", runningAvg: base + 2, baseline: base - 3, updatedAt: now },
    { patientId, domain: "Recall", runningAvg: base + 8, baseline: base + 2, updatedAt: now },
    { patientId, domain: "Pattern Recognition", runningAvg: base + 1, baseline: base - 2, updatedAt: now },
  ];
  domainStats.set(patientId, initial);
  return initial;
}

seedDomainStats("p1", 78);
seedDomainStats("p2", 72);
seedDomainStats("p3", 84);
seedDomainStats("p4", 76);
seedDomainStats("p5", 81);

// --- Adaptive Rules ---
function updateRunningAverage(oldAverage: number, score: number): number {
  const newAvg = Math.round(oldAverage * 0.7 + score * 0.3);
  return Math.max(0, Math.min(100, newAvg));
}

function calculateNextDifficulty(
  currentDifficulty: string,
  scorePct: number
): { nextDifficulty: string; action: "increased" | "decreased" | "maintained"; explanation: string } {
  const diff = VALID_DIFFICULTIES.includes(currentDifficulty.toLowerCase() as (typeof VALID_DIFFICULTIES)[number])
    ? currentDifficulty.toLowerCase()
    : "beginner";

  if (scorePct >= 70) {
    if (diff === "beginner") {
      return {
        nextDifficulty: "moderate",
        action: "increased",
        explanation: "Great recall! Advancing to moderate practice.",
      };
    }
    if (diff === "moderate") {
      return {
        nextDifficulty: "pro",
        action: "increased",
        explanation: "Excellent engagement! Moving to pro exercises.",
      };
    }
    return {
      nextDifficulty: "pro",
      action: "maintained",
      explanation: "Outstanding performance! Maintaining top level.",
    };
  }

  if (scorePct < 40) {
    if (diff === "advanced" || diff === "pro") {
      return {
        nextDifficulty: "moderate",
        action: "decreased",
        explanation: "Adjusting to a gentler pace with supportive practice.",
      };
    }
    if (diff === "moderate") {
      return {
        nextDifficulty: "beginner",
        action: "decreased",
        explanation: "Adjusting to comfortable beginner exercises.",
      };
    }
    return {
      nextDifficulty: "beginner",
      action: "maintained",
      explanation: "Continuing gentle practice at this foundational level.",
    };
  }

  const targetDiff = diff === "advanced" ? "pro" : diff;
  return {
    nextDifficulty: targetDiff,
    action: "maintained",
    explanation: "Steady performance! Continuing at current pace.",
  };
}

function getDomainStatusLabel(runningAvg: number): "Needs Practice" | "Stable" | "Strong" {
  if (runningAvg < 70) return "Needs Practice";
  if (runningAvg >= 82) return "Strong";
  return "Stable";
}

// --- OLS Ridge Regression Analytics ---
function solveOlsRidge(X: number[][], y: number[], l2 = 0.01): number[] {
  const n = X.length;
  if (n === 0) return [];
  const p = X[0].length;

  const XTX: number[][] = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      return sum + (i === j && i > 0 ? l2 : 0);
    })
  );

  const XTy: number[] = Array.from({ length: p }, (_, i) => {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    return sum;
  });

  const M = XTX.map((row, i) => [...row, XTy[i]]);

  for (let i = 0; i < p; i++) {
    let maxRow = i;
    for (let r = i + 1; r < p; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[maxRow][i])) {
        maxRow = r;
      }
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let j = i; j <= p; j++) {
      M[i][j] /= pivot;
    }

    for (let r = 0; r < p; r++) {
      if (r !== i) {
        const factor = M[r][i];
        for (let j = i; j <= p; j++) {
          M[r][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row[p]);
}

function encodeDifficulty(diff: string): number {
  const d = (diff || "").toLowerCase();
  if (d === "pro" || d === "advanced") return 3.0;
  if (d === "moderate") return 2.0;
  return 1.0;
}

function extractFeatures(
  session: GameSessionRecord,
  runningAvg: number
): [number, number, number, number, number] {
  const score = Number(session.score ?? 75);
  const acc = Number(session.accuracy ?? score);
  const timeTaken = Number(session.timeTaken ?? 60);
  const timeScore = Math.max(20.0, Math.min(100.0, 100.0 - timeTaken * 0.5));
  const diffVal = encodeDifficulty(session.difficulty);
  return [score, runningAvg, acc, timeScore, diffVal];
}

function trainCognitiveRegression(sessions: GameSessionRecord[], currentRunningAvg = 78) {
  const featureNames = [
    "Previous Score (X1)",
    "7-Day Rolling Avg (X2)",
    "Accuracy (X3)",
    "Time Efficiency (X4)",
    "Difficulty Level (X5)",
  ];

  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const nSessions = sortedSessions.length;

  if (nSessions < 3) {
    const fallbackIntercept = 18.0;
    const fallbackCoeffs = {
      "Previous Score (X1)": 0.35,
      "7-Day Rolling Avg (X2)": 0.35,
      "Accuracy (X3)": 0.12,
      "Time Efficiency (X4)": 0.08,
      "Difficulty Level (X5)": 0.8,
    };
    const latest = sortedSessions[nSessions - 1];
    let predicted = currentRunningAvg;
    if (latest) {
      const [x1, x2, x3, x4, x5] = extractFeatures(latest, currentRunningAvg);
      predicted = fallbackIntercept + 0.35 * x1 + 0.35 * x2 + 0.12 * x3 + 0.08 * x4 + 0.8 * x5;
    }

    return {
      status: "prior_baseline",
      sampleSize: nSessions,
      trainedPairs: 0,
      featureNames,
      coefficients: fallbackCoeffs,
      intercept: fallbackIntercept,
      rSquared: 0.72,
      rmse: 4.5,
      predictedNextScore: Math.max(40, Math.min(100, Math.round(predicted))),
      historicalPairs: [],
      formula: "Y = 18.0 + 0.35*X1 + 0.35*X2 + 0.12*X3 + 0.08*X4 + 0.8*X5",
    };
  }

  const X: number[][] = [];
  const y: number[] = [];
  const historicalPairs: Record<string, number>[] = [];
  let rolling = Number(sortedSessions[0].score ?? 75);

  for (let i = 0; i < sortedSessions.length - 1; i++) {
    const curr = sortedSessions[i];
    const nxt = sortedSessions[i + 1];
    const [x1, x2, x3, x4, x5] = extractFeatures(curr, rolling);
    const targetY = Number(nxt.score ?? 75);

    X.push([1.0, x1, x2, x3, x4, x5]);
    y.push(targetY);

    historicalPairs.push({
      sessionIndex: i + 1,
      previousScore: Math.round(x1 * 10) / 10,
      rollingAvg: Math.round(x2 * 10) / 10,
      accuracy: Math.round(x3 * 10) / 10,
      timeScore: Math.round(x4 * 10) / 10,
      difficulty: Math.round(x5 * 10) / 10,
      actualNextScore: Math.round(targetY * 10) / 10,
    });

    rolling = Math.round(rolling * 0.7 + Number(curr.score ?? 75) * 0.3);
  }

  let b = solveOlsRidge(X, y, 0.01);
  if (!b || b.length < 6) {
    b = [15.0, 0.35, 0.35, 0.12, 0.08, 0.8];
  }

  const yMean = y.reduce((acc, val) => acc + val, 0) / y.length;
  const ssTot = y.reduce((acc, val) => acc + (val - yMean) ** 2, 0);
  const ssRes = X.reduce((acc, row, i) => {
    const pred = row.reduce((s, val, j) => s + val * b[j], 0);
    return acc + (y[i] - pred) ** 2;
  }, 0);

  const rSquared = ssTot > 1e-9 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  const rmse = Math.sqrt(ssRes / y.length);

  const latest = sortedSessions[nSessions - 1];
  const [lx1, lx2, lx3, lx4, lx5] = extractFeatures(latest, currentRunningAvg);
  const predicted = b[0] + b[1] * lx1 + b[2] * lx2 + b[3] * lx3 + b[4] * lx4 + b[5] * lx5;

  const round4 = (v: number) => Math.round(v * 10000) / 10000;
  const round2 = (v: number) => Math.round(v * 100) / 100;
  const round1 = (v: number) => Math.round(v * 10) / 10;

  return {
    status: "trained_ols",
    sampleSize: nSessions,
    trainedPairs: y.length,
    featureNames,
    coefficients: {
      "Previous Score (X1)": round4(b[1]),
      "7-Day Rolling Avg (X2)": round4(b[2]),
      "Accuracy (X3)": round4(b[3]),
      "Time Efficiency (X4)": round4(b[4]),
      "Difficulty Level (X5)": round4(b[5]),
    },
    intercept: Math.round(b[0] * 1000) / 1000,
    rSquared: Math.round(rSquared * 1000) / 1000,
    rmse: round2(rmse),
    predictedNextScore: Math.max(40, Math.min(100, Math.round(predicted))),
    historicalPairs,
    formula: `Y = ${round1(b[0])} + ${round2(b[1])}*X1 + ${round2(b[2])}*X2 + ${round2(b[3])}*X3 + ${round2(b[4])}*X4 + ${round2(b[5])}*X5`,
  };
}

function getHybridDifficultyRecommendation(predictedScore: number, currentDifficulty: string) {
  const diff = (currentDifficulty || "beginner").toLowerCase();
  const normalized = ["beginner", "moderate", "pro", "advanced"].includes(diff) ? diff : "beginner";

  if (predictedScore >= 75) {
    if (normalized === "beginner") {
      return {
        suggestedDifficulty: "moderate",
        action: "advancing",
        explanation: "Regression model predicts strong engagement (score ≥ 75%). Ready for Moderate challenge.",
      };
    }
    if (normalized === "moderate") {
      return {
        suggestedDifficulty: "pro",
        action: "advancing",
        explanation: "Predicted score indicates high cognitive retention. Advancing to Pro practice.",
      };
    }
    return {
      suggestedDifficulty: "pro",
      action: "maintaining",
      explanation: "Consistent top-tier cognitive trajectory. Maintaining Pro practice.",
    };
  }

  if (predictedScore < 45) {
    if (normalized === "pro" || normalized === "advanced") {
      return {
        suggestedDifficulty: "moderate",
        action: "adjusting",
        explanation: "Forecast suggests a gentler pace is supportive. Moving to Moderate exercises.",
      };
    }
    if (normalized === "moderate") {
      return {
        suggestedDifficulty: "beginner",
        action: "adjusting",
        explanation: "Offering comfortable foundational engagement at Beginner level.",
      };
    }
    return {
      suggestedDifficulty: "beginner",
      action: "maintaining",
      explanation: "Continuing gentle foundational practice with steady support.",
    };
  }

  const target = normalized === "advanced" ? "pro" : normalized;
  return {
    suggestedDifficulty: target,
    action: "maintaining",
    explanation: `Forecast indicates steady performance (${predictedScore}%). Continuing comfortably at ${target.charAt(0).toUpperCase() + target.slice(1)}.`,
  };
}

// --- Auth & Relationship Helpers ---
const VALID_REMINDER_CATEGORIES = new Set<ReminderCategory>([
  "Medicine",
  "Water Intake",
  "Exercise",
  "Daily Activity",
  "Doctor Appointment",
  "Custom Reminder",
]);

const VALID_REPEAT_FREQUENCIES = new Set<RepeatFrequency>(["none", "daily", "weekly", "custom"]);

function categoryToType(cat: ReminderCategory): ReminderType {
  if (cat === "Medicine") return "medicine";
  if (cat === "Water Intake") return "water";
  if (cat === "Daily Activity") return "meal";
  return "general";
}

function hashServerPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, usedSalt, 64).toString("hex");
  return { hash, salt: usedSalt };
}

function verifyServerPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function issueSessionToken(userId: string): string {
  const token = crypto.randomBytes(24).toString("hex");
  authSessions.set(token, userId);
  return token;
}

function sanitizePublicUser(u: ServerUserRecord) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    inviteCode: u.inviteCode,
    profileImage: u.profileImage,
    patientId: u.patientId,
    caretakerId: u.caretakerId,
    doctorId: u.doctorId,
  };
}

function isCaregiverConnectedToPatient(caregiverId: string | undefined, patientId: string): boolean {
  if (!caregiverId || !patientId) return false;
  return relationships.some(
    (r) => r.caregiverId === caregiverId && r.patientId === patientId && r.status === "ACTIVE"
  );
}

function findUserByQuery(query: string, expectedRole?: Role): ServerUserRecord | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  for (const user of serverUsers.values()) {
    if (expectedRole && user.role !== expectedRole) continue;
    if (
      user.id.toLowerCase() === q ||
      (user.inviteCode && user.inviteCode.toLowerCase() === q) ||
      (user.patientId && user.patientId.toLowerCase() === q) ||
      (user.caretakerId && user.caretakerId.toLowerCase() === q)
    ) {
      return user;
    }
  }
  return undefined;
}

interface AuthenticatedRequest extends Request {
  authUser?: ServerUserRecord;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: () => void) {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Authentication required. Missing Bearer token." });
  }
  const token = authHeader.slice(7).trim();
  const userId = authSessions.get(token);
  if (!userId) {
    return res.status(401).json({ detail: "Invalid or expired session token." });
  }
  const user = serverUsers.get(userId);
  if (!user) {
    return res.status(401).json({ detail: "Authenticated user record not found." });
  }
  req.authUser = user;
  next();
}

// --- Express App Setup ---
async function startServer() {
  const app = express();
  app.use(express.json());

  // Health Check
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      version: "1.1.0",
      app: "RECALLED Cognitive Backend Slice",
    });
  });

  // --- Auth & Session Endpoints (Server-Side Identity) ---
  app.post("/api/v1/auth/register", (req: Request, res: Response) => {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "") as Role;

    if (!name || !email || !password) {
      return res.status(400).json({ detail: "Name, email, and password are required." });
    }
    if (!["patient", "caretaker", "doctor"].includes(role)) {
      return res.status(400).json({ detail: "Invalid account role." });
    }

    for (const existing of serverUsers.values()) {
      if (existing.email.toLowerCase() === email && existing.role === role) {
        return res.status(409).json({ detail: "An account with this email and role already exists." });
      }
    }

    const { hash, salt } = hashServerPassword(password);
    const userId = String(body.id || `u-${role}-${Date.now()}`).trim();
    if (serverUsers.has(userId)) {
      return res.status(409).json({ detail: "User ID already exists." });
    }

    let patientId: string | undefined;
    let caretakerId: string | undefined;
    let doctorId: string | undefined;
    let inviteCode: string | undefined;

    if (role === "patient") {
      patientId = String(body.patientId || `p-${Date.now()}`).trim();
      inviteCode = String(body.inviteCode || `PAT-${patientId.replace(/^p-?/, "").toUpperCase().slice(0, 8)}`).trim();
      if (!patients.has(patientId)) {
        const numericAge = Number(body.age);
        const safeAge = !Number.isNaN(numericAge) && numericAge > 0 && numericAge <= 125 ? numericAge : 70;
        patients.set(patientId, {
          id: patientId,
          userId,
          inviteCode,
          name,
          age: safeAge,
          birthYear: new Date().getFullYear() - safeAge,
          region: String(body.region || "India"),
          language: SUPPORTED_LANGUAGES.has(String(body.language || "en")) ? String(body.language) : "en",
          baselineScore: 75,
          caretakerId: "",
          caretakerIds: [],
        });
        seedDomainStats(patientId, 75);
      }
    } else if (role === "caretaker") {
      caretakerId = String(body.caretakerId || `c-${Date.now()}`).trim();
      inviteCode = String(body.inviteCode || `CARE-${caretakerId.replace(/^c-?/, "").toUpperCase().slice(0, 8)}`).trim();
      caretakers.set(caretakerId, {
        id: caretakerId,
        userId,
        inviteCode,
        name,
        email,
        phone: String(body.phone || "+91 98000 00000"),
        relationshipLabel: String(body.relationshipLabel || "Family Caregiver"),
        patientIds: [],
      });
    } else {
      doctorId = String(body.doctorId || `d-${Date.now()}`).trim();
    }

    const newUser: ServerUserRecord = {
      id: userId,
      name,
      email,
      role,
      inviteCode,
      patientId,
      caretakerId,
      doctorId,
      passwordHash: hash,
      passwordSalt: salt,
    };
    serverUsers.set(userId, newUser);

    const token = issueSessionToken(userId);
    return res.status(201).json({ token, user: sanitizePublicUser(newUser) });
  });

  app.post("/api/v1/auth/login", (req: Request, res: Response) => {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "") as Role;

    let match: ServerUserRecord | undefined;
    for (const u of serverUsers.values()) {
      if (u.email.toLowerCase() === email && (!role || u.role === role)) {
        match = u;
        break;
      }
    }
    if (!match || !match.passwordHash || !match.passwordSalt) {
      return res.status(401).json({ detail: "Invalid email, password, or role." });
    }
    if (!verifyServerPassword(password, match.passwordHash, match.passwordSalt)) {
      return res.status(401).json({ detail: "Invalid email, password, or role." });
    }

    const token = issueSessionToken(match.id);
    return res.json({ token, user: sanitizePublicUser(match) });
  });

  // Establishes a session for seeded demo accounts or prototype local accounts without allowing role escalation
  app.post("/api/v1/auth/session", (req: Request, res: Response) => {
    const body = req.body || {};
    const requestedId = String(body.userId || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "") as Role;

    let existing = requestedId ? serverUsers.get(requestedId) : undefined;
    if (!existing && email && role) {
      for (const u of serverUsers.values()) {
        if (u.email.toLowerCase() === email && u.role === role) {
          existing = u;
          break;
        }
      }
    }

    if (existing) {
      const token = issueSessionToken(existing.id);
      return res.json({ token, user: sanitizePublicUser(existing) });
    }

    // Register prototype local account on server if not yet present (never overwrites existing users)
    if (!requestedId || !["patient", "caretaker", "doctor"].includes(role)) {
      return res.status(400).json({ detail: "Valid userId and role are required." });
    }

    const name = String(body.name || "RECALLED User").trim();
    const safeEmail = email || `${requestedId}@recalled.care`;
    let patientId = body.patientId ? String(body.patientId).trim() : undefined;
    let caretakerId = body.caretakerId ? String(body.caretakerId).trim() : undefined;
    let doctorId = body.doctorId ? String(body.doctorId).trim() : undefined;
    let inviteCode = body.inviteCode ? String(body.inviteCode).trim() : undefined;

    if (role === "patient") {
      patientId = patientId || `p-${Date.now()}`;
      inviteCode = inviteCode || `PAT-${patientId.replace(/^p-?/, "").toUpperCase().slice(0, 8)}`;
      if (!patients.has(patientId)) {
        const numericAge = Number(body.age);
        const safeAge = !Number.isNaN(numericAge) && numericAge > 0 && numericAge <= 125 ? numericAge : 70;
        patients.set(patientId, {
          id: patientId,
          userId: requestedId,
          inviteCode,
          name,
          age: safeAge,
          birthYear: new Date().getFullYear() - safeAge,
          region: String(body.region || "India"),
          language: SUPPORTED_LANGUAGES.has(String(body.language || "en")) ? String(body.language) : "en",
          baselineScore: 75,
          caretakerId: "",
          caretakerIds: [],
        });
        seedDomainStats(patientId, 75);
      }
    } else if (role === "caretaker") {
      caretakerId = caretakerId || `c-${Date.now()}`;
      inviteCode = inviteCode || `CARE-${caretakerId.replace(/^c-?/, "").toUpperCase().slice(0, 8)}`;
      if (!caretakers.has(caretakerId)) {
        caretakers.set(caretakerId, {
          id: caretakerId,
          userId: requestedId,
          inviteCode,
          name,
          email: safeEmail,
          phone: String(body.phone || "+91 98000 00000"),
          relationshipLabel: "Family Caregiver",
          patientIds: [],
        });
      }
    } else {
      doctorId = doctorId || "d1";
    }

    const created: ServerUserRecord = {
      id: requestedId,
      name,
      email: safeEmail,
      role,
      inviteCode,
      patientId,
      caretakerId,
      doctorId,
    };
    serverUsers.set(requestedId, created);
    const token = issueSessionToken(created.id);
    return res.json({ token, user: sanitizePublicUser(created) });
  });

  // Sync non-sensitive patient shell for newly onboarded/registered patients
  app.post("/api/v1/patients/sync", (req: Request, res: Response) => {
    const body = req.body || {};
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    if (!id || !name) {
      return res.status(400).json({ detail: "Patient id and name are required." });
    }

    const numericAge = Number(body.age);
    const safeAge = !Number.isNaN(numericAge) && numericAge > 0 && numericAge <= 125 ? numericAge : 70;
    const numericBirthYear = Number(body.birthYear);
    const safeBirthYear =
      !Number.isNaN(numericBirthYear) && numericBirthYear > 1900
        ? numericBirthYear
        : new Date().getFullYear() - safeAge;
    const lang = SUPPORTED_LANGUAGES.has(String(body.language || "en"))
      ? String(body.language)
      : "en";

    const existingPatient = patients.get(id);
    const record: PatientRecord = {
      id,
      userId: existingPatient?.userId || (body.userId ? String(body.userId) : `u-patient-${id.replace(/^p-?/, "")}`),
      inviteCode: existingPatient?.inviteCode || (body.inviteCode ? String(body.inviteCode) : `PAT-${id.toUpperCase()}`),
      name,
      age: safeAge,
      birthYear: safeBirthYear,
      region: String(body.region || existingPatient?.region || "India"),
      language: lang,
      baselineScore: Number(body.baselineScore) || existingPatient?.baselineScore || 75,
      caretakerId: existingPatient?.caretakerId ?? "",
      caretakerIds: existingPatient?.caretakerIds ?? [],
    };

    patients.set(id, record);
    if (!domainStats.has(id)) {
      seedDomainStats(id, record.baselineScore);
    }

    return res.status(200).json({ ok: true, patient: record });
  });

  // --- Patient-Caregiver Connection Endpoints ---
  app.get("/api/v1/connections/search", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "patient" && authUser.role !== "caretaker") {
      return res.status(403).json({ detail: "Only patients and caregivers can search connections." });
    }

    const query = String(req.query.query || "").trim();
    if (!query) {
      return res.status(400).json({ detail: "Please enter a unique User ID or invitation code." });
    }

    const targetRole: Role = authUser.role === "patient" ? "caretaker" : "patient";
    const targetUser = findUserByQuery(query, targetRole);
    if (!targetUser) {
      return res.status(404).json({ detail: `No ${targetRole === "caretaker" ? "caregiver" : "patient"} found matching '${query}'.` });
    }

    const patientId = authUser.role === "patient" ? authUser.patientId : targetUser.patientId;
    const caregiverId = authUser.role === "caretaker" ? authUser.caretakerId : targetUser.caretakerId;

    const isConnected = Boolean(
      patientId &&
        caregiverId &&
        relationships.some(
          (r) => r.patientId === patientId && r.caregiverId === caregiverId && r.status === "ACTIVE"
        )
    );

    const pendingOut = connectionRequests.find(
      (r) =>
        r.status === "PENDING" &&
        r.senderId === authUser.id &&
        r.receiverId === targetUser.id
    );
    const pendingIn = connectionRequests.find(
      (r) =>
        r.status === "PENDING" &&
        r.senderId === targetUser.id &&
        r.receiverId === authUser.id
    );

    const connectionStatus = isConnected
      ? "CONNECTED"
      : pendingOut
      ? "PENDING_OUTGOING"
      : pendingIn
      ? "PENDING_INCOMING"
      : "NONE";

    if (targetUser.role === "patient") {
      const pat = targetUser.patientId ? patients.get(targetUser.patientId) : undefined;
      return res.json({
        userId: targetUser.id,
        entityId: targetUser.patientId || targetUser.id,
        name: pat?.name || targetUser.name,
        role: "patient",
        inviteCode: targetUser.inviteCode || pat?.inviteCode || `PAT-${targetUser.id}`,
        profileImage: targetUser.profileImage,
        age: pat?.age,
        region: pat?.region,
        connectionStatus,
        pendingRequestId: pendingOut?.id || pendingIn?.id,
      });
    }

    const cg = targetUser.caretakerId ? caretakers.get(targetUser.caretakerId) : undefined;
    return res.json({
      userId: targetUser.id,
      entityId: targetUser.caretakerId || targetUser.id,
      name: cg?.name || targetUser.name,
      role: "caretaker",
      inviteCode: targetUser.inviteCode || cg?.inviteCode || `CARE-${targetUser.id}`,
      profileImage: targetUser.profileImage || cg?.profileImage,
      relationshipLabel: cg?.relationshipLabel || "Caregiver",
      connectionStatus,
      pendingRequestId: pendingOut?.id || pendingIn?.id,
    });
  });

  app.post("/api/v1/connections/request", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "patient" && authUser.role !== "caretaker") {
      return res.status(403).json({ detail: "Only patients and caregivers can send connection requests." });
    }

    const body = req.body || {};
    const targetQuery = String(body.targetId || body.receiverId || body.inviteCode || "").trim();
    const message = body.message ? String(body.message).trim().slice(0, 300) : undefined;

    if (!targetQuery) {
      return res.status(400).json({ detail: "Target user ID or invitation code is required." });
    }

    const targetUser = findUserByQuery(targetQuery);
    if (!targetUser) {
      return res.status(404).json({ detail: `No user found with ID or invitation code '${targetQuery}'.` });
    }

    if (targetUser.id === authUser.id) {
      return res.status(400).json({ detail: "You cannot send a connection request to yourself." });
    }

    if (targetUser.role === authUser.role) {
      return res.status(400).json({
        detail: `Connections can only be formed between a patient and a caregiver, not two ${authUser.role}s.`,
      });
    }

    if (targetUser.role === "doctor") {
      return res.status(400).json({ detail: "Doctor accounts cannot be added as patient-caregiver connections." });
    }

    const patientId = authUser.role === "patient" ? authUser.patientId : targetUser.patientId;
    const caregiverId = authUser.role === "caretaker" ? authUser.caretakerId : targetUser.caretakerId;

    if (!patientId || !caregiverId) {
      return res.status(400).json({ detail: "Both patient and caregiver profiles must exist to connect." });
    }

    const alreadyConnected = relationships.some(
      (r) => r.patientId === patientId && r.caregiverId === caregiverId && r.status === "ACTIVE"
    );
    if (alreadyConnected) {
      return res.status(409).json({ detail: "These accounts are already connected." });
    }

    const duplicatePending = connectionRequests.find(
      (r) =>
        r.status === "PENDING" &&
        ((r.senderId === authUser.id && r.receiverId === targetUser.id) ||
          (r.senderId === targetUser.id && r.receiverId === authUser.id))
    );
    if (duplicatePending) {
      return res.status(409).json({
        detail:
          duplicatePending.senderId === authUser.id
            ? "A pending request to this user already exists."
            : "This user has already sent you a pending request. Check your incoming requests.",
      });
    }

    const now = new Date().toISOString();
    const newReq: ConnectionRequestRecord = {
      id: `creq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: authUser.id,
      receiverId: targetUser.id,
      senderRole: authUser.role,
      receiverRole: targetUser.role,
      senderName: authUser.name,
      receiverName: targetUser.name,
      senderInviteCode: authUser.inviteCode,
      receiverInviteCode: targetUser.inviteCode,
      senderProfileImage: authUser.profileImage,
      receiverProfileImage: targetUser.profileImage,
      patientId,
      caregiverId,
      message,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    connectionRequests.unshift(newReq);
    return res.status(201).json(newReq);
  });

  app.get("/api/v1/connections/incoming", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const list = connectionRequests
      .filter((r) => r.receiverId === authUser.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return res.json(list);
  });

  app.get("/api/v1/connections/outgoing", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const list = connectionRequests
      .filter((r) => r.senderId === authUser.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return res.json(list);
  });

  app.post("/api/v1/connections/:id/accept", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const targetReq = connectionRequests.find((r) => r.id === req.params.id);
    if (!targetReq) {
      return res.status(404).json({ detail: "Connection request not found." });
    }
    if (targetReq.receiverId !== authUser.id) {
      return res.status(403).json({ detail: "Only the receiving user can accept this request." });
    }
    if (targetReq.status !== "PENDING") {
      return res.status(409).json({ detail: `Cannot accept a request with status '${targetReq.status}'.` });
    }

    const now = new Date().toISOString();
    targetReq.status = "ACCEPTED";
    targetReq.updatedAt = now;

    const patientId = targetReq.patientId!;
    const caregiverId = targetReq.caregiverId!;

    let rel = relationships.find(
      (r) => r.patientId === patientId && r.caregiverId === caregiverId
    );
    if (rel) {
      rel.status = "ACTIVE";
      rel.connectedAt = now;
      rel.disconnectedAt = undefined;
    } else {
      rel = {
        id: `rel-${caregiverId}-${patientId}`,
        patientId,
        caregiverId,
        patientUserId: targetReq.senderRole === "patient" ? targetReq.senderId : targetReq.receiverId,
        caregiverUserId: targetReq.senderRole === "caretaker" ? targetReq.senderId : targetReq.receiverId,
        connectedAt: now,
        status: "ACTIVE",
      };
      relationships.push(rel);
    }

    const cg = caretakers.get(caregiverId);
    if (cg && !cg.patientIds.includes(patientId)) {
      cg.patientIds.push(patientId);
    }
    const pat = patients.get(patientId);
    if (pat) {
      const nextIds = Array.from(new Set([...(pat.caretakerIds || []), caregiverId]));
      pat.caretakerIds = nextIds;
      if (!pat.caretakerId) pat.caretakerId = caregiverId;
    }

    return res.json({ request: targetReq, relationship: rel });
  });

  app.post("/api/v1/connections/:id/reject", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const targetReq = connectionRequests.find((r) => r.id === req.params.id);
    if (!targetReq) {
      return res.status(404).json({ detail: "Connection request not found." });
    }
    if (targetReq.receiverId !== authUser.id) {
      return res.status(403).json({ detail: "Only the receiving user can reject this request." });
    }
    if (targetReq.status !== "PENDING") {
      return res.status(409).json({ detail: `Cannot reject a request with status '${targetReq.status}'.` });
    }

    targetReq.status = "REJECTED";
    targetReq.updatedAt = new Date().toISOString();
    return res.json({ request: targetReq });
  });

  app.post("/api/v1/connections/:id/cancel", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const targetReq = connectionRequests.find((r) => r.id === req.params.id);
    if (!targetReq) {
      return res.status(404).json({ detail: "Connection request not found." });
    }
    if (targetReq.senderId !== authUser.id) {
      return res.status(403).json({ detail: "Only the sender can cancel this request." });
    }
    if (targetReq.status !== "PENDING") {
      return res.status(409).json({ detail: `Cannot cancel a request with status '${targetReq.status}'.` });
    }

    targetReq.status = "CANCELLED";
    targetReq.updatedAt = new Date().toISOString();
    return res.json({ request: targetReq });
  });

  app.get("/api/v1/connections/patients", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "caretaker" || !authUser.caretakerId) {
      return res.status(403).json({ detail: "Only caregivers can view connected patients." });
    }

    const activeRels = relationships.filter(
      (r) => r.caregiverId === authUser.caretakerId && r.status === "ACTIVE"
    );

    const list = activeRels
      .map((rel) => {
        const pat = patients.get(rel.patientId);
        if (!pat) return null;
        const pReminders = reminders.filter((rem) => rem.patientId === pat.id && rem.isActive !== false);
        const pendingRemindersCount = pReminders.filter(
          (rem) => rem.status !== "completed" && rem.status !== "taken"
        ).length;
        const completedRemindersCount = pReminders.filter(
          (rem) => rem.status === "completed" || rem.status === "taken"
        ).length;
        const pSessions = gameSessions
          .filter((gs) => gs.patientId === pat.id)
          .sort((a, b) => b.date.localeCompare(a.date));
        const latestSession = pSessions[0];
        const stats = domainStats.get(pat.id) || [];
        const averageScore = stats.length
          ? Math.round(stats.reduce((sum, s) => sum + s.runningAvg, 0) / stats.length)
          : pat.baselineScore;

        return {
          patient: pat,
          relationshipId: rel.id,
          connectedAt: rel.connectedAt,
          caregiverId: authUser.caretakerId,
          pendingRemindersCount,
          completedRemindersCount,
          latestActivity: latestSession
            ? `${latestSession.gameId.replace(/_/g, " ")} (${latestSession.score}%)`
            : undefined,
          averageScore,
        };
      })
      .filter(Boolean);

    return res.json(list);
  });

  app.get("/api/v1/connections/caregivers", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "patient" || !authUser.patientId) {
      return res.status(403).json({ detail: "Only patients can view connected caregivers." });
    }

    const activeRels = relationships.filter(
      (r) => r.patientId === authUser.patientId && r.status === "ACTIVE"
    );

    const list = activeRels
      .map((rel) => {
        const cg = caretakers.get(rel.caregiverId);
        if (!cg) return null;
        return {
          caregiver: cg,
          relationshipId: rel.id,
          connectedAt: rel.connectedAt,
        };
      })
      .filter(Boolean);

    return res.json(list);
  });

  app.delete("/api/v1/connections/:id", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const rel = relationships.find((r) => r.id === req.params.id);
    if (!rel) {
      return res.status(404).json({ detail: "Active connection not found." });
    }

    const isParticipant =
      (authUser.role === "patient" && authUser.patientId === rel.patientId) ||
      (authUser.role === "caretaker" && authUser.caretakerId === rel.caregiverId);

    if (!isParticipant) {
      return res.status(403).json({ detail: "You are not authorized to disconnect this relationship." });
    }

    rel.status = "DISCONNECTED";
    rel.disconnectedAt = new Date().toISOString();

    const cg = caretakers.get(rel.caregiverId);
    if (cg) {
      cg.patientIds = cg.patientIds.filter((pid) => pid !== rel.patientId);
    }

    const pat = patients.get(rel.patientId);
    if (pat) {
      pat.caretakerIds = (pat.caretakerIds || []).filter((cid) => cid !== rel.caregiverId);
      if (pat.caretakerId === rel.caregiverId) {
        pat.caretakerId = pat.caretakerIds[0] || "";
      }
    }

    return res.json({ ok: true, relationship: rel });
  });

  // --- Shared Reminder Endpoints ---
  app.get("/api/v1/reminders", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const requestedPatientId = req.query.patientId ? String(req.query.patientId).trim() : "";

    if (authUser.role === "patient") {
      if (!authUser.patientId) {
        return res.status(403).json({ detail: "Patient profile missing." });
      }
      if (requestedPatientId && requestedPatientId !== authUser.patientId) {
        return res.status(403).json({ detail: "Patients can only access their own reminders." });
      }
      const list = reminders.filter(
        (r) => r.patientId === authUser.patientId && r.isActive !== false
      );
      return res.json(list);
    }

    if (authUser.role === "caretaker") {
      if (!requestedPatientId) {
        return res.status(400).json({ detail: "patientId query parameter is required." });
      }
      if (!isCaregiverConnectedToPatient(authUser.caretakerId, requestedPatientId)) {
        return res.status(403).json({ detail: "Access denied. You are not connected to this patient." });
      }
      const list = reminders.filter((r) => r.patientId === requestedPatientId);
      return res.json(list);
    }

    if (authUser.role === "doctor") {
      if (!requestedPatientId || !patients.has(requestedPatientId)) {
        return res.status(404).json({ detail: "Patient not found." });
      }
      return res.json(reminders.filter((r) => r.patientId === requestedPatientId));
    }

    return res.status(403).json({ detail: "Unauthorized role." });
  });

  app.post("/api/v1/reminders", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "caretaker" && authUser.role !== "doctor") {
      return res.status(403).json({ detail: "Only authorized caregivers or doctors can create reminders." });
    }

    const body = req.body || {};
    const patientId = String(body.patientId || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description ?? body.notes ?? "").trim();
    const category = (body.category || "Custom Reminder") as ReminderCategory;
    const scheduledDate = String(body.scheduledDate || new Date().toISOString().split("T")[0]).trim();
    const scheduledTime = String(body.scheduledTime || body.time || "09:00").trim();
    const repeatFrequency = (body.repeatFrequency || "none") as RepeatFrequency;
    const customRepeatNote = body.customRepeatNote ? String(body.customRepeatNote).trim() : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const dosage = body.dosage ? String(body.dosage).trim() : undefined;

    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({ detail: `Patient '${patientId}' not found.` });
    }

    if (authUser.role === "caretaker" && !isCaregiverConnectedToPatient(authUser.caretakerId, patientId)) {
      return res.status(403).json({ detail: "Access denied. You are not connected to this patient." });
    }

    if (!title) {
      return res.status(400).json({ detail: "Reminder title is required." });
    }
    if (!VALID_REMINDER_CATEGORIES.has(category)) {
      return res.status(400).json({ detail: `Invalid category '${category}'.` });
    }
    if (!VALID_REPEAT_FREQUENCIES.has(repeatFrequency)) {
      return res.status(400).json({ detail: `Invalid repeat frequency '${repeatFrequency}'.` });
    }

    const now = new Date().toISOString();
    const newReminder: ReminderRecord = {
      id: body.id ? String(body.id) : `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      patientId,
      type: categoryToType(category),
      category,
      title,
      description,
      notes: description,
      instructions: description || undefined,
      dosage,
      time: scheduledTime,
      scheduledDate,
      scheduledTime,
      repeatFrequency,
      customRepeatNote,
      isActive,
      status: "upcoming",
      createdBy: authUser.caretakerId || authUser.doctorId || authUser.id,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    reminders.push(newReminder);
    return res.status(201).json(newReminder);
  });

  app.put("/api/v1/reminders/:id", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "caretaker" && authUser.role !== "doctor") {
      return res.status(403).json({ detail: "Patients cannot edit caregiver-created reminders." });
    }

    const idx = reminders.findIndex((r) => r.id === req.params.id);
    if (idx < 0) {
      return res.status(404).json({ detail: "Reminder not found." });
    }
    const existing = reminders[idx];

    if (authUser.role === "caretaker" && !isCaregiverConnectedToPatient(authUser.caretakerId, existing.patientId)) {
      return res.status(403).json({ detail: "Access denied. You are not connected to this patient." });
    }

    const body = req.body || {};
    if (body.patientId && String(body.patientId) !== existing.patientId) {
      return res.status(400).json({ detail: "Cannot reassign a reminder to a different patient." });
    }

    const nextCategory = body.category ? (String(body.category) as ReminderCategory) : existing.category;
    if (!VALID_REMINDER_CATEGORIES.has(nextCategory)) {
      return res.status(400).json({ detail: `Invalid category '${nextCategory}'.` });
    }

    const nextRepeat = body.repeatFrequency
      ? (String(body.repeatFrequency) as RepeatFrequency)
      : existing.repeatFrequency;
    if (!VALID_REPEAT_FREQUENCIES.has(nextRepeat)) {
      return res.status(400).json({ detail: `Invalid repeat frequency '${nextRepeat}'.` });
    }

    const nextTitle = body.title !== undefined ? String(body.title).trim() : existing.title;
    if (!nextTitle) {
      return res.status(400).json({ detail: "Reminder title cannot be empty." });
    }

    const nextDescription =
      body.description !== undefined
        ? String(body.description).trim()
        : body.notes !== undefined
        ? String(body.notes).trim()
        : existing.description;
    const nextTime =
      body.scheduledTime !== undefined
        ? String(body.scheduledTime).trim()
        : body.time !== undefined
        ? String(body.time).trim()
        : existing.scheduledTime;
    const nextDate =
      body.scheduledDate !== undefined ? String(body.scheduledDate).trim() : existing.scheduledDate;

    const updated: ReminderRecord = {
      ...existing,
      title: nextTitle,
      description: nextDescription,
      notes: nextDescription,
      instructions: nextDescription || existing.instructions,
      category: nextCategory,
      type: categoryToType(nextCategory),
      scheduledDate: nextDate,
      scheduledTime: nextTime,
      time: nextTime,
      repeatFrequency: nextRepeat,
      customRepeatNote:
        body.customRepeatNote !== undefined ? String(body.customRepeatNote).trim() : existing.customRepeatNote,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      dosage: body.dosage !== undefined ? String(body.dosage).trim() || undefined : existing.dosage,
      status: body.status ? (String(body.status) as ReminderStatus) : existing.status,
      updatedAt: new Date().toISOString(),
    };

    reminders[idx] = updated;
    return res.json(updated);
  });

  app.delete("/api/v1/reminders/:id", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    if (authUser.role !== "caretaker" && authUser.role !== "doctor") {
      return res.status(403).json({ detail: "Patients cannot delete reminders." });
    }

    const idx = reminders.findIndex((r) => r.id === req.params.id);
    if (idx < 0) {
      return res.status(404).json({ detail: "Reminder not found." });
    }
    const existing = reminders[idx];

    if (authUser.role === "caretaker" && !isCaregiverConnectedToPatient(authUser.caretakerId, existing.patientId)) {
      return res.status(403).json({ detail: "Access denied. You are not connected to this patient." });
    }

    reminders.splice(idx, 1);
    return res.json({ ok: true, id: req.params.id });
  });

  app.patch("/api/v1/reminders/:id/complete", requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const idx = reminders.findIndex((r) => r.id === req.params.id);
    if (idx < 0) {
      return res.status(404).json({ detail: "Reminder not found." });
    }
    const existing = reminders[idx];

    if (authUser.role === "patient") {
      if (existing.patientId !== authUser.patientId) {
        return res.status(403).json({ detail: "Patients can only update completion status for their own reminders." });
      }
      if (existing.isActive === false) {
        return res.status(400).json({ detail: "Cannot complete an inactive reminder." });
      }
    } else if (authUser.role === "caretaker") {
      if (!isCaregiverConnectedToPatient(authUser.caretakerId, existing.patientId)) {
        return res.status(403).json({ detail: "Access denied. You are not connected to this patient." });
      }
    }

    const body = req.body || {};
    const requestedStatus = String(body.status || "completed") as ReminderStatus;
    if (!["completed", "taken", "upcoming", "snoozed"].includes(requestedStatus)) {
      return res.status(400).json({ detail: "Invalid completion status." });
    }

    const now = new Date().toISOString();
    const updated: ReminderRecord = {
      ...existing,
      status: requestedStatus,
      completedAt: requestedStatus === "completed" || requestedStatus === "taken" ? now : null,
      snoozedUntil: body.snoozedUntil ? String(body.snoozedUntil) : existing.snoozedUntil,
      updatedAt: now,
      adherenceHistory: [
        ...(existing.adherenceHistory || []),
        { date: now.split("T")[0], status: requestedStatus, timestamp: now },
      ],
    };

    reminders[idx] = updated;
    return res.json(updated);
  });

  // Save Game Result
  app.post("/api/v1/games/results", (req: Request, res: Response) => {
    const body = req.body || {};
    const {
      id,
      patientId,
      gameId,
      domain,
      score,
      timeTaken,
      difficulty,
      result = "completed",
      date,
      accuracy,
      attempts,
      mistakes,
    } = body;

    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({
        detail: `Patient with ID '${patientId}' does not exist.`,
      });
    }

    if (!VALID_DOMAINS.includes(domain)) {
      return res.status(400).json({
        detail: `Invalid cognitive domain '${domain}'. Must be one of: ${VALID_DOMAINS.join(", ")}`,
      });
    }

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({
        detail: `Invalid gameId '${gameId}'. Must be one of: ${VALID_GAMES.join(", ")}`,
      });
    }

    const normDiff = String(difficulty || "").toLowerCase();
    if (!VALID_DIFFICULTIES.includes(normDiff as (typeof VALID_DIFFICULTIES)[number])) {
      return res.status(400).json({
        detail: `Invalid difficulty '${difficulty}'. Must be: ${VALID_DIFFICULTIES.join(", ")}`,
      });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ detail: "Score must be between 0 and 100." });
    }

    const sessionId = id || `gs-${Date.now()}`;
    const existing = gameSessions.find((s) => s.id === sessionId);
    const statsList = domainStats.get(patientId) || seedDomainStats(patientId);

    if (existing) {
      const stat = statsList.find((s) => s.domain === domain);
      const currentAvg = stat ? stat.runningAvg : numericScore;
      const adaptive = calculateNextDifficulty(existing.difficulty, existing.score);
      const sortedStats = [...statsList].sort((a, b) => a.runningAvg - b.runningAvg);
      const weakest = sortedStats[0] || stat;

      const weakestInfo = {
        domain: weakest ? weakest.domain : domain,
        statusLabel: getDomainStatusLabel(weakest ? weakest.runningAvg : currentAvg),
        recommendedGameId: DOMAIN_TO_GAME_MAP[weakest ? weakest.domain : domain] || "memory_match",
        runningAvg: weakest ? weakest.runningAvg : currentAvg,
        baseline: weakest ? weakest.baseline : 70,
      };

      return res.status(201).json({
        session: existing,
        updatedDomainAverage: {
          domain,
          runningAvg: currentAvg,
          previousAvg: currentAvg,
        },
        nextDifficulty: adaptive.nextDifficulty,
        adaptiveAction: adaptive.action,
        adaptiveExplanation: adaptive.explanation,
        weakestDomain: weakestInfo,
        recommendedGame: weakestInfo.recommendedGameId,
      });
    }

    const sessionRecord: GameSessionRecord = {
      id: sessionId,
      patientId,
      gameId,
      domain,
      score: numericScore,
      timeTaken: Number(timeTaken ?? 0),
      difficulty: normDiff,
      result,
      date: date || new Date().toISOString(),
      accuracy: accuracy !== undefined ? Number(accuracy) : undefined,
      attempts: attempts !== undefined ? Number(attempts) : undefined,
      mistakes: mistakes !== undefined ? Number(mistakes) : undefined,
    };
    gameSessions.push(sessionRecord);

    let stat = statsList.find((s) => s.domain === domain);
    let previousAvg = numericScore;
    if (stat) {
      previousAvg = stat.runningAvg;
      stat.runningAvg = updateRunningAverage(previousAvg, numericScore);
      stat.updatedAt = new Date().toISOString();
    } else {
      stat = {
        patientId,
        domain,
        runningAvg: numericScore,
        baseline: numericScore,
        updatedAt: new Date().toISOString(),
      };
      statsList.push(stat);
    }

    const adaptive = calculateNextDifficulty(normDiff, numericScore);
    const sortedStats = [...statsList].sort((a, b) => a.runningAvg - b.runningAvg);
    const weakest = sortedStats[0] || stat;

    const weakestInfo = {
      domain: weakest.domain,
      statusLabel: getDomainStatusLabel(weakest.runningAvg),
      recommendedGameId: DOMAIN_TO_GAME_MAP[weakest.domain] || "memory_match",
      runningAvg: weakest.runningAvg,
      baseline: weakest.baseline,
    };

    return res.status(201).json({
      session: sessionRecord,
      updatedDomainAverage: {
        domain,
        runningAvg: stat.runningAvg,
        previousAvg,
      },
      nextDifficulty: adaptive.nextDifficulty,
      adaptiveAction: adaptive.action,
      adaptiveExplanation: adaptive.explanation,
      weakestDomain: weakestInfo,
      recommendedGame: weakestInfo.recommendedGameId,
    });
  });

  // Get Game Sessions
  app.get("/api/v1/games/sessions", (req: Request, res: Response) => {
    const patientId = String(req.query.patientId || "");
    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({ detail: `Patient with ID '${patientId}' not found.` });
    }

    const records = gameSessions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json(records);
  });

  // Get Recommendations
  app.get("/api/v1/games/recommendations", (req: Request, res: Response) => {
    const patientId = String(req.query.patientId || "");
    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({ detail: `Patient with ID '${patientId}' not found.` });
    }

    const stats = domainStats.get(patientId) || seedDomainStats(patientId);
    const domainScores = stats.map((s) => ({
      domain: s.domain,
      statusLabel: getDomainStatusLabel(s.runningAvg),
      recommendedGameId: DOMAIN_TO_GAME_MAP[s.domain] || "memory_match",
      runningAvg: s.runningAvg,
      baseline: s.baseline,
    }));

    const sortedDomains = [...domainScores].sort((a, b) => a.runningAvg - b.runningAvg);
    const weakest = sortedDomains[0];

    const latestSession = gameSessions
      .filter((s) => s.patientId === patientId && s.gameId === weakest.recommendedGameId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    res.json({
      patientId,
      domainScores,
      weakestDomain: weakest,
      recommendedGame: weakest.recommendedGameId,
      currentDifficulty: latestSession ? latestSession.difficulty : "beginner",
    });
  });

  // Regression Analytics
  app.get("/api/v1/analytics/regression", (req: Request, res: Response) => {
    const patientId = String(req.query.patientId || "");
    const patient = patients.get(patientId);
    if (!patientId || !patient) {
      return res.status(404).json({ detail: `Patient with ID '${patientId}' not found.` });
    }

    const sessions = gameSessions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const stats = domainStats.get(patientId) || seedDomainStats(patientId);
    const avgScore = stats.length
      ? Math.round(stats.reduce((sum, s) => sum + s.runningAvg, 0) / stats.length)
      : 78;

    const regResult = trainCognitiveRegression(sessions, avgScore);
    const latestDiff = sessions.length > 0 ? sessions[sessions.length - 1].difficulty : "beginner";
    const hybridRec = getHybridDifficultyRecommendation(regResult.predictedNextScore, latestDiff);

    res.json({
      patientId,
      regression: regResult,
      hybridRecommendation: hybridRec,
      currentBaseline: patient.baselineScore,
      currentAverage: avgScore,
    });
  });

  // Text-to-Speech Proxy (ElevenLabs with graceful 503 fallback to browser Web Speech)
  const handleTts = async (req: Request, res: Response) => {
    const { text, language = "en", gender = "female" } = req.body || {};
    const cleanText = String(text || "").trim();

    if (!cleanText) {
      return res.status(400).json({ detail: "Text cannot be empty." });
    }
    if (cleanText.length > 400) {
      return res.status(400).json({
        detail: `Text length (${cleanText.length} characters) exceeds 400 character limit.`,
      });
    }

    let normLang = String(language || "en").trim().toLowerCase();
    if (normLang.includes("-")) {
      normLang = normLang.split("-")[0];
    }
    if (!SUPPORTED_LANGUAGES.has(normLang)) {
      return res.status(400).json({
        detail: `Unsupported language '${language}'. Supported languages: en (English), bn (Bengali), hi (Hindi).`,
      });
    }

    const apiKey = (process.env.ELEVENLABS_API_KEY || "").trim();
    const femaleVoiceId = (process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM").trim();
    const maleVoiceId = (process.env.ELEVENLABS_MALE_VOICE_ID || "pNInz6obpgDQGcFmaJgB").trim();
    const normGender = String(gender || "female").trim().toLowerCase();
    const voiceId = normGender === "male" && maleVoiceId ? maleVoiceId : femaleVoiceId;

    const cacheKey = crypto
      .createHash("sha256")
      .update(`${voiceId}:${normLang}:${cleanText}`)
      .digest("hex");

    const cached = ttsAudioCache.get(cacheKey);
    if (cached && cached.length > 0) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(cached);
    }

    if (!apiKey) {
      return res.status(503).json({
        detail: "ElevenLabs TTS service is not configured. (ELEVENLABS_API_KEY missing)",
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.8,
              style: 0.05,
              use_speaker_boost: true,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!upstream.ok) {
        return res.status(502).json({
          detail: `ElevenLabs TTS service returned status ${upstream.status}.`,
        });
      }

      const arrayBuf = await upstream.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);
      if (!audioBuffer.length) {
        return res.status(502).json({
          detail: "Received empty audio from ElevenLabs TTS service.",
        });
      }

      ttsAudioCache.set(cacheKey, audioBuffer);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(audioBuffer);
    } catch {
      return res.status(502).json({
        detail: "Failed to communicate with ElevenLabs TTS service.",
      });
    }
  };

  app.post("/api/tts", handleTts);
  app.post("/api/v1/tts", handleTts);

  // Vite middleware in development, static assets in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`RECALLED server running at http://0.0.0.0:${port}`);
  });
}

startServer();
