import {
  Patient,
  Caretaker,
  Doctor,
  Reminder,
  WaterEvent,
  Prescription,
  MemoryAlbumItem,
  CaregiverNote,
  AlertItem,
  GameSession,
  DomainStats,
  MemoryLaneMemory
} from "../types";

export const initialPatients: Patient[] = [
  {
    id: "p1",
    name: "Anand Sharma",
    age: 74,
    birthYear: 1952,
    region: "Northern & Eastern India",
    language: "en",
    interests: ["Indian Films & Actors", "Music", "Cricket", "Regional Culture", "Historical Events"],
    caretakerId: "c1",
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Priya Sharma (Daughter)",
      phone: "+91 98765 43210",
      relation: "Daughter & Primary Caregiver"
    },
    baselineScore: 78
  },
  {
    id: "p2",
    name: "Savitri Devi",
    age: 71,
    birthYear: 1955,
    region: "Bengal & Delhi",
    language: "bn",
    interests: ["Music", "Festivals", "Cooking & Culture"],
    caretakerId: "c1",
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Rohan Verma (Son)",
      phone: "+91 98111 22334",
      relation: "Son"
    },
    baselineScore: 72
  },
  {
    id: "p3",
    name: "Dr. Ramesh Roy",
    age: 79,
    birthYear: 1947,
    region: "Kolkata",
    language: "bn",
    interests: ["Literature", "History", "Rabindra Sangeet", "Cinema"],
    caretakerId: "c1",
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Sunil Roy (Brother)",
      phone: "+91 98300 44556",
      relation: "Brother"
    },
    baselineScore: 84
  }
];

export const initialCaretakers: Caretaker[] = [
  {
    id: "c1",
    name: "Priya Sharma",
    email: "priya.sharma@care.org",
    phone: "+91 98765 43210",
    patientIds: ["p1", "p2", "p3"]
  }
];

export const initialDoctors: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Arvind Mukherjee",
    email: "dr.mukherjee@cityneuro.org",
    phone: "+91 98200 11223",
    specialty: "Consultant Neurologist & Geriatric Care",
    clinic: "Metropolitan Memory & Neurosciences Clinic, Kolkata",
    patientIds: ["p1", "p2", "p3"]
  }
];

export const initialReminders: Reminder[] = [
  {
    id: "rem-1",
    patientId: "p1",
    type: "medicine",
    title: "Amlodipine (Blood Pressure)",
    time: "08:00",
    status: "taken",
    dosage: "5 mg",
    frequency: "Once daily in the morning",
    instructions: "Take after breakfast with water",
    createdBy: "d1",
    notes: "Prescribed for BP stabilization"
  },
  {
    id: "rem-2",
    patientId: "p1",
    type: "meal",
    title: "Morning Breakfast",
    mealType: "breakfast",
    time: "08:30",
    status: "completed",
    createdBy: "c1",
    notes: "Oatmeal with almonds & papaya"
  },
  {
    id: "rem-3",
    patientId: "p1",
    type: "water",
    title: "Morning Hydration",
    time: "10:30",
    status: "taken",
    createdBy: "c1",
    notes: "Patient reported drinking 1 glass"
  },
  {
    id: "rem-4",
    patientId: "p1",
    type: "meal",
    title: "Nutritious Lunch",
    mealType: "lunch",
    time: "13:00",
    status: "completed",
    createdBy: "c1",
    notes: "Rice, dal, seasonal vegetables"
  },
  {
    id: "rem-5",
    patientId: "p1",
    type: "medicine",
    title: "Donepezil (Cognitive Support)",
    time: "14:00",
    status: "upcoming",
    dosage: "5 mg",
    frequency: "Once daily after lunch",
    instructions: "Take with half glass of water",
    createdBy: "d1",
    notes: "Doctor prescribed cognitive support medication"
  },
  {
    id: "rem-6",
    patientId: "p1",
    type: "water",
    title: "Afternoon Water",
    time: "16:00",
    status: "upcoming",
    createdBy: "c1",
    notes: "Scheduled hydration prompt"
  },
  {
    id: "rem-7",
    patientId: "p1",
    type: "meal",
    title: "Dinner",
    mealType: "dinner",
    time: "20:00",
    status: "upcoming",
    createdBy: "c1",
    notes: "Light dinner: rotis, paneer, warm milk"
  },
  {
    id: "rem-8",
    patientId: "p1",
    type: "medicine",
    title: "Atorvastatin (Cholesterol)",
    time: "21:00",
    status: "upcoming",
    dosage: "10 mg",
    frequency: "Once daily before sleep",
    instructions: "Take at bedtime",
    createdBy: "d1",
    notes: "Bedtime lipid management"
  }
];

export const initialWaterEvents: WaterEvent[] = [
  {
    id: "we-1",
    reminderId: "rem-3",
    patientId: "p1",
    scheduledAt: "10:30",
    confirmedAt: "10:32",
    status: "patient_reported_drinking",
    selfReportedQty: "one_glass",
    verificationSource: "self-report"
  },
  {
    id: "we-2",
    reminderId: "rem-6",
    patientId: "p1",
    scheduledAt: "16:00",
    status: "scheduled",
    verificationSource: "self-report"
  }
];

export const initialPrescriptions: Prescription[] = [
  {
    id: "rx-101",
    patientId: "p1",
    doctorId: "d1",
    doctorName: "Dr. Arvind Mukherjee",
    doctorSpecialty: "Consultant Neurologist & Geriatric Care",
    clinicName: "Metropolitan Memory & Neurosciences Clinic",
    date: "2026-09-20",
    medicines: [
      {
        name: "Donepezil Hydrochloride",
        dosage: "5 mg",
        frequency: "Once daily",
        timing: "After lunch (14:00)",
        duration: "90 days",
        instructions: "Take after lunch with water. Monitor for mild GI symptoms."
      },
      {
        name: "Amlodipine Besylate",
        dosage: "5 mg",
        frequency: "Once daily",
        timing: "Morning after breakfast (08:00)",
        duration: "90 days",
        instructions: "Keep regular record of morning BP."
      },
      {
        name: "Atorvastatin",
        dosage: "10 mg",
        frequency: "Once daily",
        timing: "Bedtime (21:00)",
        duration: "90 days",
        instructions: "Take after light snack before sleep."
      }
    ],
    notes: "Encourage 20 minutes of daily cognitive exercises and structured morning walks. Continue social engagement and photo memory recall.",
    addedToSchedule: true
  }
];

export const initialMemoryAlbum: MemoryAlbumItem[] = [
  {
    id: "ma-1",
    patientId: "p1",
    category: "family",
    title: "Priya's Graduation Day",
    image: "/graduation_family.jpg",
    person: "Priya Sharma",
    relationship: "Daughter",
    year: "2015",
    description: "Proud moment at Kolkata University convocation ceremony when Priya received her Master's degree in Economics.",
    enabledForGame: true
  },
  {
    id: "ma-2",
    patientId: "p1",
    category: "family",
    title: "Grandson Aarav's First Birthday",
    image: "/grandson_birthday.svg",
    person: "Aarav Sharma",
    relationship: "Grandson",
    year: "2021",
    description: "Family celebration with homemade sweets and traditional blessings.",
    enabledForGame: true
  },
  {
    id: "ma-3",
    patientId: "p1",
    category: "places",
    title: "Family Trip to Darjeeling",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
    person: "Family",
    relationship: "Family Vacation",
    year: "1998",
    description: "Viewing the Kanchenjunga sunrise from Tiger Hill and riding the Himalayan Toy Train.",
    enabledForGame: true
  },
  {
    id: "ma-4",
    patientId: "p1",
    category: "childhood",
    title: "Ancestral Home in Varanasi",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&auto=format&fit=crop&q=80",
    person: "Grandfather",
    relationship: "Ancestral Heritage",
    year: "1960",
    description: "The courtyard where cousins used to play during summer holidays by the Ganges.",
    enabledForGame: true
  }
];

export const initialCaregiverNotes: CaregiverNote[] = [
  {
    id: "cn-1",
    patientId: "p1",
    authorId: "c1",
    authorName: "Priya Sharma",
    text: "Father seemed very cheerful today after looking at old family albums. Completed morning walk comfortably.",
    date: "2026-10-01",
    mood: "Cheerful & Engaged"
  },
  {
    id: "cn-2",
    patientId: "p1",
    authorId: "c1",
    authorName: "Priya Sharma",
    text: "Took medicine on time. Enjoyed the Pattern Rhythm activity and scored well.",
    date: "2026-09-30",
    mood: "Attentive"
  }
];

export const initialAlerts: AlertItem[] = [
  {
    id: "alt-1",
    patientId: "p1",
    type: "medicine",
    severity: "info",
    message: "Patient completed today's morning scheduled medicine on time.",
    timestamp: "2026-10-02T08:05:00.000Z",
    resolved: true
  },
  {
    id: "alt-2",
    patientId: "p1",
    type: "water",
    severity: "info",
    message: "Patient reported having water for the morning interval.",
    timestamp: "2026-10-02T10:32:00.000Z",
    resolved: true
  }
];

export const initialMemoriesTimeline: MemoryLaneMemory[] = [
  {
    id: "ml-1",
    patientId: "p1",
    title: "Durga Puja Pandal Hopping 2024",
    date: "October 2024",
    location: "Kolkata, West Bengal",
    culturalCategory: "Festivals & Tradition",
    description: "Visited the traditional pandals with family, enjoyed Dhunuchi dance and bhog with grandchildren.",
    image: "https://images.unsplash.com/photo-1602781442111-9fca05f25bf6?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "ml-2",
    patientId: "p1",
    title: "Rabindra Sangeet Evening",
    date: "May 2022",
    location: "Rabindra Sadan, Kolkata",
    culturalCategory: "Music & Performing Arts",
    description: "Attended a classic evening of Tagore songs on Pachise Baisakh. Heard 'Ami Chini Go Chini Tomare'.",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "ml-3",
    patientId: "p1",
    title: "Darjeeling Toy Train Ride",
    date: "December 1998",
    location: "Darjeeling, West Bengal",
    culturalCategory: "Heritage & Travel",
    description: "Historic steam engine ride through the Batasia Loop with the magnificent snow-capped mountains in view.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
  }
];

export const initialGameSessions: GameSession[] = [
  {
    id: "gs-1",
    patientId: "p1",
    gameId: "memory_match",
    domain: "Memory & Attention",
    score: 85,
    timeTaken: 72,
    difficulty: "moderate",
    result: "completed",
    date: "2026-10-01T11:00:00.000Z"
  },
  {
    id: "gs-2",
    patientId: "p1",
    gameId: "pattern_rhythm",
    domain: "Pattern Recognition & Attention",
    score: 75,
    timeTaken: 85,
    difficulty: "moderate",
    result: "completed",
    date: "2026-09-30T10:30:00.000Z"
  },
  {
    id: "gs-3",
    patientId: "p1",
    gameId: "complete_the_pattern",
    domain: "Pattern Recognition",
    score: 80,
    timeTaken: 65,
    difficulty: "beginner",
    result: "completed",
    date: "2026-09-29T15:20:00.000Z"
  },
  {
    id: "gs-4",
    patientId: "p1",
    gameId: "memory_lane",
    domain: "Recall",
    score: 90,
    timeTaken: 90,
    difficulty: "moderate",
    result: "completed",
    date: "2026-09-28T16:00:00.000Z"
  },
  {
    id: "gs-5",
    patientId: "p1",
    gameId: "family_recall",
    domain: "Memory & Recall",
    score: 80,
    timeTaken: 55,
    difficulty: "beginner",
    result: "completed",
    date: "2026-09-27T11:15:00.000Z"
  }
];

export const initialDomainStats: DomainStats[] = [
  {
    patientId: "p1",
    domain: "Memory & Attention",
    runningAvg: 82,
    baseline: 78,
    history: [
      { date: "2026-09-25", score: 76 },
      { date: "2026-09-26", score: 78 },
      { date: "2026-09-27", score: 80 },
      { date: "2026-09-28", score: 82 },
      { date: "2026-09-29", score: 79 },
      { date: "2026-09-30", score: 83 },
      { date: "2026-10-01", score: 85 }
    ]
  },
  {
    patientId: "p1",
    domain: "Pattern Recognition & Attention",
    runningAvg: 76,
    baseline: 74,
    history: [
      { date: "2026-09-25", score: 72 },
      { date: "2026-09-26", score: 74 },
      { date: "2026-09-27", score: 75 },
      { date: "2026-09-28", score: 76 },
      { date: "2026-09-29", score: 74 },
      { date: "2026-09-30", score: 78 },
      { date: "2026-10-01", score: 77 }
    ]
  },
  {
    patientId: "p1",
    domain: "Memory & Recall",
    runningAvg: 80,
    baseline: 75,
    history: [
      { date: "2026-09-25", score: 75 },
      { date: "2026-09-26", score: 78 },
      { date: "2026-09-27", score: 79 },
      { date: "2026-09-28", score: 81 },
      { date: "2026-09-29", score: 80 },
      { date: "2026-09-30", score: 82 },
      { date: "2026-10-01", score: 80 }
    ]
  },
  {
    patientId: "p1",
    domain: "Recall",
    runningAvg: 86,
    baseline: 80,
    history: [
      { date: "2026-09-25", score: 80 },
      { date: "2026-09-26", score: 82 },
      { date: "2026-09-27", score: 85 },
      { date: "2026-09-28", score: 88 },
      { date: "2026-09-29", score: 85 },
      { date: "2026-09-30", score: 87 },
      { date: "2026-10-01", score: 89 }
    ]
  },
  {
    patientId: "p1",
    domain: "Pattern Recognition",
    runningAvg: 79,
    baseline: 76,
    history: [
      { date: "2026-09-25", score: 76 },
      { date: "2026-09-26", score: 77 },
      { date: "2026-09-27", score: 78 },
      { date: "2026-09-28", score: 80 },
      { date: "2026-09-29", score: 79 },
      { date: "2026-09-30", score: 81 },
      { date: "2026-10-01", score: 80 }
    ]
  }
];
