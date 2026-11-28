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
  MemoryLaneMemory,
  ConnectionRequest,
  PatientCaregiverRelationship
} from "../types";

const TODAY_ISO_DATE = new Date().toISOString().split("T")[0];

export const initialPatients: Patient[] = [
  {
    id: "p1",
    userId: "u-patient-1",
    inviteCode: "PAT-ANAND-P1",
    name: "Anand Sharma",
    age: 74,
    birthYear: 1952,
    region: "Kolkata, West Bengal",
    city: "Kolkata",
    state: "West Bengal",
    language: "en",
    interests: ["Indian Films & Actors", "Music", "Cricket", "Regional Culture", "Historical Events"],
    caretakerId: "c1",
    caretakerIds: ["c1"],
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Priya Sharma (Daughter)",
      phone: "+91 98765 43210",
      relation: "Daughter & Primary Caregiver"
    },
    baselineScore: 78,
    onboardingCompleted: true,
    basicInfo: {
      fullName: "Anand Sharma",
      age: 74,
      city: "Kolkata",
      state: "West Bengal",
      preferredLanguage: "en"
    },
    medicalInfo: {
      voluntaryConsentGiven: true,
      hasPriorAssessment: "yes",
      assessmentDetails: "Routine geriatric memory wellness follow-up",
      prescription: {
        hasPrescription: true,
        doctorName: "Dr. Arvind Mukherjee",
        prescriptionDate: "2026-09-20",
        manualNotes: "Routine cognitive support & blood pressure schedule"
      }
    },
    familyInfo: {
      assistedByCaregiver: true,
      allowInGames: true,
      spouse: { name: "Meera Sharma", relationDetail: "Wife" },
      children: [{ id: "fam-c1", name: "Priya Sharma", relationDetail: "Daughter" }],
      grandchildren: [{ id: "fam-g1", name: "Aarav Sharma", relationDetail: "Grandson" }]
    },
    structuredInterests: {
      sports: ["Cricket"],
      entertainment: ["Music", "Movies"],
      lifestyle: ["Local festivals and traditions"],
      custom: ["Indian Films & Actors", "Historical Events"]
    },
    dislikes: {
      dislikedSportsOrTeams: [],
      dislikedEntertainment: [],
      uncomfortableTopics: [],
      excludedPeopleOrSubjects: [],
      otherExclusions: []
    }
  },
  {
    id: "p2",
    userId: "u-patient-2",
    inviteCode: "PAT-SAVITRI-P2",
    name: "Savitri Devi",
    age: 71,
    birthYear: 1955,
    region: "Kolkata, West Bengal",
    city: "Kolkata",
    state: "West Bengal",
    language: "bn",
    interests: ["Music", "Festivals", "Cooking & Culture"],
    caretakerId: "c1",
    caretakerIds: ["c1"],
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Rohan Verma (Son)",
      phone: "+91 98111 22334",
      relation: "Son"
    },
    baselineScore: 72,
    onboardingCompleted: true,
    basicInfo: {
      fullName: "Savitri Devi",
      age: 71,
      city: "Kolkata",
      state: "West Bengal",
      preferredLanguage: "bn"
    },
    familyInfo: {
      assistedByCaregiver: true,
      allowInGames: true,
      children: [{ id: "fam-c2", name: "Rohan Verma", relationDetail: "Son" }],
      grandchildren: []
    },
    structuredInterests: {
      sports: [],
      entertainment: ["Music"],
      lifestyle: ["Cooking", "Local festivals and traditions"],
      custom: []
    },
    dislikes: {
      dislikedSportsOrTeams: [],
      dislikedEntertainment: [],
      uncomfortableTopics: [],
      excludedPeopleOrSubjects: [],
      otherExclusions: []
    }
  },
  {
    id: "p3",
    userId: "u-patient-3",
    inviteCode: "PAT-RAMESH-P3",
    name: "Dr. Ramesh Roy",
    age: 79,
    birthYear: 1947,
    region: "Kolkata, West Bengal",
    city: "Kolkata",
    state: "West Bengal",
    language: "bn",
    interests: ["Literature", "History", "Rabindra Sangeet", "Cinema"],
    caretakerId: "c1",
    caretakerIds: ["c1"],
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Sunil Roy (Brother)",
      phone: "+91 98300 44556",
      relation: "Brother"
    },
    baselineScore: 84,
    onboardingCompleted: true,
    basicInfo: {
      fullName: "Dr. Ramesh Roy",
      age: 79,
      city: "Kolkata",
      state: "West Bengal",
      preferredLanguage: "bn"
    },
    familyInfo: {
      assistedByCaregiver: false,
      allowInGames: true,
      children: [],
      grandchildren: []
    },
    structuredInterests: {
      sports: [],
      entertainment: ["Movies", "Reading", "Music"],
      lifestyle: ["Local festivals and traditions"],
      custom: ["Rabindra Sangeet", "History"]
    },
    dislikes: {
      dislikedSportsOrTeams: [],
      dislikedEntertainment: [],
      uncomfortableTopics: [],
      excludedPeopleOrSubjects: [],
      otherExclusions: []
    }
  },
  {
    id: "p4",
    userId: "u-patient-4",
    inviteCode: "PAT-MEERA-P4",
    name: "Meera Krishnan",
    age: 76,
    birthYear: 1950,
    region: "Bengaluru, Karnataka",
    city: "Bengaluru",
    state: "Karnataka",
    language: "en",
    interests: ["Classical Music", "Gardening", "Cooking"],
    caretakerId: "",
    caretakerIds: [],
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Karthik Krishnan (Son)",
      phone: "+91 99001 44556",
      relation: "Son"
    },
    baselineScore: 76,
    onboardingCompleted: true,
    basicInfo: {
      fullName: "Meera Krishnan",
      age: 76,
      city: "Bengaluru",
      state: "Karnataka",
      preferredLanguage: "en"
    },
    familyInfo: {
      assistedByCaregiver: false,
      allowInGames: true,
      children: [{ id: "fam-c4", name: "Karthik Krishnan", relationDetail: "Son" }],
      grandchildren: []
    },
    structuredInterests: {
      sports: [],
      entertainment: ["Music"],
      lifestyle: ["Gardening", "Cooking"],
      custom: ["Classical Music"]
    },
    dislikes: {
      dislikedSportsOrTeams: [],
      dislikedEntertainment: [],
      uncomfortableTopics: [],
      excludedPeopleOrSubjects: [],
      otherExclusions: []
    }
  },
  {
    id: "p5",
    userId: "u-patient-5",
    inviteCode: "PAT-HARISH-P5",
    name: "Harish Patel",
    age: 69,
    birthYear: 1957,
    region: "Ahmedabad, Gujarat",
    city: "Ahmedabad",
    state: "Gujarat",
    language: "hi",
    interests: ["Morning Walks", "Bhajans", "Chess"],
    caretakerId: "",
    caretakerIds: [],
    doctorIds: ["d1"],
    emergencyContact: {
      name: "Neha Patel (Daughter)",
      phone: "+91 98250 77889",
      relation: "Daughter"
    },
    baselineScore: 81,
    onboardingCompleted: true,
    basicInfo: {
      fullName: "Harish Patel",
      age: 69,
      city: "Ahmedabad",
      state: "Gujarat",
      preferredLanguage: "hi"
    },
    familyInfo: {
      assistedByCaregiver: false,
      allowInGames: true,
      children: [{ id: "fam-c5", name: "Neha Patel", relationDetail: "Daughter" }],
      grandchildren: []
    },
    structuredInterests: {
      sports: ["Chess"],
      entertainment: ["Music"],
      lifestyle: ["Morning Walks"],
      custom: ["Bhajans"]
    },
    dislikes: {
      dislikedSportsOrTeams: [],
      dislikedEntertainment: [],
      uncomfortableTopics: [],
      excludedPeopleOrSubjects: [],
      otherExclusions: []
    }
  }
];

export const initialCaretakers: Caretaker[] = [
  {
    id: "c1",
    userId: "u-caretaker-1",
    inviteCode: "CARE-PRIYA-C1",
    name: "Priya Sharma",
    email: "priya.sharma@care.org",
    phone: "+91 98765 43210",
    relationshipLabel: "Daughter & Family Caregiver",
    patientIds: ["p1", "p2", "p3"]
  },
  {
    id: "c2",
    userId: "u-caretaker-2",
    inviteCode: "CARE-RAHUL-C2",
    name: "Rahul Verma",
    email: "rahul.verma@care.org",
    phone: "+91 98111 22334",
    relationshipLabel: "Family Caregiver",
    patientIds: []
  }
];

export const initialRelationships: PatientCaregiverRelationship[] = [
  {
    id: "rel-c1-p1",
    patientId: "p1",
    caregiverId: "c1",
    patientUserId: "u-patient-1",
    caregiverUserId: "u-caretaker-1",
    connectedAt: "2026-09-01T09:00:00.000Z",
    status: "ACTIVE"
  },
  {
    id: "rel-c1-p2",
    patientId: "p2",
    caregiverId: "c1",
    patientUserId: "u-patient-2",
    caregiverUserId: "u-caretaker-1",
    connectedAt: "2026-09-05T10:30:00.000Z",
    status: "ACTIVE"
  },
  {
    id: "rel-c1-p3",
    patientId: "p3",
    caregiverId: "c1",
    patientUserId: "u-patient-3",
    caregiverUserId: "u-caretaker-1",
    connectedAt: "2026-09-10T14:15:00.000Z",
    status: "ACTIVE"
  }
];

export const initialConnectionRequests: ConnectionRequest[] = [
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
    updatedAt: "2026-11-27T08:30:00.000Z"
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
    updatedAt: "2026-11-27T11:00:00.000Z"
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
    updatedAt: "2026-11-28T05:15:00.000Z"
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
  },
  // Patient 2 (Savitri Devi) Reminders
  {
    id: "rem-p2-1",
    patientId: "p2",
    type: "medicine",
    category: "Medicine",
    title: "Thyroxine 50mcg",
    description: "Take on an empty stomach 30 minutes before morning tea",
    time: "07:00",
    scheduledDate: TODAY_ISO_DATE,
    scheduledTime: "07:00",
    repeatFrequency: "daily",
    isActive: true,
    status: "taken",
    dosage: "50 mcg",
    frequency: "Once daily",
    instructions: "Take with warm water before breakfast",
    createdBy: "c1",
    completedAt: "2026-11-28T07:05:00.000Z",
    notes: "Morning thyroid support"
  },
  {
    id: "rem-p2-2",
    patientId: "p2",
    type: "general",
    category: "Exercise",
    title: "Gentle Terrace Walk & Stretching",
    description: "15 minutes of slow walking and shoulder stretches in morning sunlight",
    time: "09:30",
    scheduledDate: TODAY_ISO_DATE,
    scheduledTime: "09:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    createdBy: "c1",
    notes: "Wear comfortable walking shoes"
  },
  {
    id: "rem-p2-3",
    patientId: "p2",
    type: "water",
    category: "Water Intake",
    title: "Midday Hydration Check",
    description: "Drink one full glass of lukewarm water",
    time: "12:30",
    scheduledDate: TODAY_ISO_DATE,
    scheduledTime: "12:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    createdBy: "c1"
  },
  // Patient 3 (Dr. Ramesh Roy) Reminders
  {
    id: "rem-p3-1",
    patientId: "p3",
    type: "medicine",
    category: "Medicine",
    title: "Metformin XR",
    description: "Take right after lunch with water",
    time: "13:30",
    scheduledDate: TODAY_ISO_DATE,
    scheduledTime: "13:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "upcoming",
    dosage: "500 mg",
    createdBy: "c1",
    notes: "After lunch blood sugar support"
  },
  {
    id: "rem-p3-2",
    patientId: "p3",
    type: "general",
    category: "Doctor Appointment",
    title: "Neurology Wellness Check-in",
    description: "Routine follow-up call with Dr. Arvind Mukherjee at Metropolitan Clinic",
    time: "17:00",
    scheduledDate: TODAY_ISO_DATE,
    scheduledTime: "17:00",
    repeatFrequency: "none",
    isActive: true,
    status: "upcoming",
    createdBy: "c1",
    notes: "Keep recent memory log handy"
  },
  {
    id: "rem-p3-3",
    patientId: "p3",
    type: "general",
    category: "Daily Activity",
    title: "Evening Rabindra Sangeet & Reading",
    description: "Listen to favourite Tagore songs for 20 minutes",
    time: "18:30",
    scheduledDate: TODAY_ISO_DATE,
    scheduledTime: "18:30",
    repeatFrequency: "daily",
    isActive: true,
    status: "completed",
    completedAt: "2026-11-28T18:45:00.000Z",
    createdBy: "c1"
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
  },
  {
    id: "cn-p2-1",
    patientId: "p2",
    authorId: "c1",
    authorName: "Priya Sharma",
    text: "Savitri ji enjoyed listening to morning devotional music and completed her breakfast smoothly.",
    date: "2026-11-27",
    mood: "Calm & Attentive"
  },
  {
    id: "cn-p3-1",
    patientId: "p3",
    authorId: "c1",
    authorName: "Priya Sharma",
    text: "Dr. Roy was very engaged during his afternoon reading and Memory Lane quiz.",
    date: "2026-11-27",
    mood: "Cheerful & Engaged"
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
  },
  {
    id: "alt-p2-1",
    patientId: "p2",
    type: "activity",
    severity: "warning",
    message: "Morning terrace walk reminder is awaiting confirmation.",
    timestamp: "2026-11-28T09:45:00.000Z",
    resolved: false
  },
  {
    id: "alt-p3-1",
    patientId: "p3",
    type: "medicine",
    severity: "info",
    message: "Upcoming afternoon Metformin XR schedule set for 13:30.",
    timestamp: "2026-11-28T08:00:00.000Z",
    resolved: false
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
    date: "2026-11-27T10:15:00.000Z"
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
    date: "2026-11-27T16:10:00.000Z"
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
  },
  // Patient 2 (Savitri Devi) Domain Stats
  {
    patientId: "p2",
    domain: "Memory & Attention",
    runningAvg: 74,
    baseline: 72,
    history: [{ date: "2026-11-27", score: 74 }]
  },
  {
    patientId: "p2",
    domain: "Pattern Recognition & Attention",
    runningAvg: 70,
    baseline: 68,
    history: [{ date: "2026-11-27", score: 70 }]
  },
  {
    patientId: "p2",
    domain: "Memory & Recall",
    runningAvg: 76,
    baseline: 72,
    history: [{ date: "2026-11-27", score: 76 }]
  },
  {
    patientId: "p2",
    domain: "Recall",
    runningAvg: 78,
    baseline: 75,
    history: [{ date: "2026-11-27", score: 78 }]
  },
  {
    patientId: "p2",
    domain: "Pattern Recognition",
    runningAvg: 71,
    baseline: 70,
    history: [{ date: "2026-11-27", score: 71 }]
  },
  // Patient 3 (Dr. Ramesh Roy) Domain Stats
  {
    patientId: "p3",
    domain: "Memory & Attention",
    runningAvg: 88,
    baseline: 84,
    history: [{ date: "2026-11-27", score: 88 }]
  },
  {
    patientId: "p3",
    domain: "Pattern Recognition & Attention",
    runningAvg: 85,
    baseline: 82,
    history: [{ date: "2026-11-27", score: 85 }]
  },
  {
    patientId: "p3",
    domain: "Memory & Recall",
    runningAvg: 86,
    baseline: 84,
    history: [{ date: "2026-11-27", score: 86 }]
  },
  {
    patientId: "p3",
    domain: "Recall",
    runningAvg: 92,
    baseline: 86,
    history: [{ date: "2026-11-27", score: 92 }]
  },
  {
    patientId: "p3",
    domain: "Pattern Recognition",
    runningAvg: 84,
    baseline: 82,
    history: [{ date: "2026-11-27", score: 84 }]
  }
];
