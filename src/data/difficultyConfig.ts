import { DifficultyLevel, Language } from "../types";

export type NormalizedDifficulty = "beginner" | "moderate" | "pro";

export interface LocalizedText {
  en: string;
  bn: string;
  hi: string;
}

export interface DifficultyTier {
  id: NormalizedDifficulty;
  name: LocalizedText;
  badgeIcon: string;
  badgeColorClass: string;
  badgeBorderClass: string;
  badgeBgClass: string;
  accentColor: string;
  tagline: LocalizedText;
  cognitiveFocus: LocalizedText;
}

export interface MemoryMatchConfig {
  pairsCount: number;
  totalCards: number;
  previewSeconds: number;
  gridColsClass: string;
  cardHeightClass: string;
  mistakePenalty: number;
  baseScore: number;
  description: LocalizedText;
}

export interface PatternRhythmConfig {
  padCount: number;
  padIds: string[];
  sequenceLength: number;
  stepSpeedMs: number;
  gridColsClass: string;
  description: LocalizedText;
}

export interface CompletePatternConfig {
  puzzleCount: number;
  timeLimitSeconds: number;
  optionsCount: number;
  description: LocalizedText;
}

export interface RhythmPadItem {
  id: string;
  name: LocalizedText;
  color: string;
  bgLight: string;
  activeBg: string;
  borderClass: string;
  symbol: string;
  frequency: number;
}

export const DIFFICULTY_TIERS: Record<NormalizedDifficulty, DifficultyTier> = {
  beginner: {
    id: "beginner",
    name: { en: "Beginner", bn: "সহজ", hi: "शुरुआती" },
    badgeIcon: "🟢",
    badgeColorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badgeBorderClass: "border-emerald-300",
    badgeBgClass: "bg-emerald-500",
    accentColor: "#10b981",
    tagline: {
      en: "Basic cognitive engagement and easy recall",
      bn: "সহজ স্মৃতিশক্তি ও প্রাথমিক মনোযোগের অনুশীলন",
      hi: "सरल स्मृति और बुनियादी एकाग्रता का अभ्यास"
    },
    cognitiveFocus: {
      en: "Low working memory demand, high contrast, gentle pace",
      bn: "কম মানসিক চাপ, স্পষ্ট ভিজ্যুয়াল ও ধীর গতি",
      hi: "कम मानसिक तनाव, स्पष्ट दृश्य और सहज गति"
    }
  },
  moderate: {
    id: "moderate",
    name: { en: "Moderate", bn: "মধ্যম", hi: "मध्यम" },
    badgeIcon: "🟡",
    badgeColorClass: "text-amber-700 bg-amber-50 border-amber-200",
    badgeBorderClass: "border-amber-300",
    badgeBgClass: "bg-amber-500",
    accentColor: "#f59e0b",
    tagline: {
      en: "Increased memory load, attention, recognition, and processing",
      bn: "মাঝারি স্মৃতিভার, মনোযোগ এবং দ্রুত শনাক্তকরণ",
      hi: "मध्यम स्मृति भार, ध्यान और त्वरित पहचान"
    },
    cognitiveFocus: {
      en: "Expanded item retention, subtle variations, moderate speed",
      bn: "বেশি উপাদান স্মরণ, সূক্ষ্ম পরিবর্তন ও স্বাভাবিক গতি",
      hi: "अधिक वस्तुएं याद रखना, सूक्ष्म अंतर और सामान्य गति"
    }
  },
  pro: {
    id: "pro",
    name: { en: "Pro", bn: "উন্নত", hi: "प्रो" },
    badgeIcon: "🔴",
    badgeColorClass: "text-rose-700 bg-rose-50 border-rose-200",
    badgeBorderClass: "border-rose-300",
    badgeBgClass: "bg-rose-500",
    accentColor: "#ef4444",
    tagline: {
      en: "High memory load, fast processing, and fine visual discrimination",
      bn: "উচ্চ স্মৃতিভার, দ্রুত প্রক্রিয়াকরণ ও সূক্ষ্ম পার্থক্য নির্ণয়",
      hi: "उच्च स्मृति भार, तीव्र गति और सूक्ष्म दृश्य अंतर पहचान"
    },
    cognitiveFocus: {
      en: "Maximum item retention, interference resistance, fast paced",
      bn: "সর্বোচ্চ তথ্য ধারণ, বিভ্রান্তি প্রতিরোধ ও দ্রুত গতি",
      hi: "अधिकतम स्मृति धारण, भटकाव प्रतिरोध और तेज गति"
    }
  }
};

export const MEMORY_MATCH_CONFIG: Record<NormalizedDifficulty, MemoryMatchConfig> = {
  beginner: {
    pairsCount: 3,
    totalCards: 6,
    previewSeconds: 5,
    gridColsClass: "grid-cols-2 sm:grid-cols-3 max-w-xl mx-auto",
    cardHeightClass: "h-32 sm:h-40",
    mistakePenalty: 3,
    baseScore: 100,
    description: {
      en: "6 cards • 5s preview • Gentle recall",
      bn: "৬টি কার্ড • ৫ সেকেন্ড দেখার সুযোগ • সহজ মেলানো",
      hi: "6 कार्ड • 5 सेकंड पूर्वावलोकन • सरल मिलान"
    }
  },
  moderate: {
    pairsCount: 6,
    totalCards: 12,
    previewSeconds: 3,
    gridColsClass: "grid-cols-3 sm:grid-cols-4 max-w-2xl mx-auto",
    cardHeightClass: "h-28 sm:h-36",
    mistakePenalty: 5,
    baseScore: 150,
    description: {
      en: "12 cards • 3s preview • Enhanced memory load",
      bn: "১২টি কার্ড • ৩ সেকেন্ড দেখার সুযোগ • মাঝারি স্মৃতিভার",
      hi: "12 कार्ड • 3 सेकंड पूर्वावलोकन • मध्यम स्मृति भार"
    }
  },
  pro: {
    pairsCount: 10,
    totalCards: 20,
    previewSeconds: 2,
    gridColsClass: "grid-cols-4 sm:grid-cols-5 max-w-3xl mx-auto",
    cardHeightClass: "h-24 sm:h-28",
    mistakePenalty: 8,
    baseScore: 200,
    description: {
      en: "20 cards • 2s preview • High working memory challenge",
      bn: "২০টি কার্ড • ২ সেকেন্ড দেখার সুযোগ • উচ্চ স্মৃতিশক্তির পরীক্ষা",
      hi: "20 कार्ड • 2 सेकंड पूर्वावलोकन • उच्च स्मृति चुनौती"
    }
  }
};

export const PATTERN_RHYTHM_CONFIG: Record<NormalizedDifficulty, PatternRhythmConfig> = {
  beginner: {
    padCount: 4,
    padIds: ["blue", "green", "red", "yellow"],
    sequenceLength: 4,
    stepSpeedMs: 1100,
    gridColsClass: "grid-cols-2 max-w-sm mx-auto",
    description: {
      en: "4 pads • 4-step sequence • Relaxed tempo (1.1s)",
      bn: "৪টি বোতাম • ৪ ধাপের সিকোয়েন্স • ধীর গতি (১.১ সে.)",
      hi: "4 बटन • 4 चरणों का क्रम • धीमी गति (1.1 से.)"
    }
  },
  moderate: {
    padCount: 6,
    padIds: ["blue", "green", "red", "yellow", "amber", "purple"],
    sequenceLength: 6,
    stepSpeedMs: 750,
    gridColsClass: "grid-cols-2 sm:grid-cols-3 max-w-md mx-auto",
    description: {
      en: "6 pads • 6-step sequence • Moderate tempo (0.75s)",
      bn: "৬টি বোতাম • ৬ ধাপের সিকোয়েন্স • মাঝারি গতি (০.৭৫ সে.)",
      hi: "6 बटन • 6 चरणों का क्रम • मध्यम गति (0.75 से.)"
    }
  },
  pro: {
    padCount: 8,
    padIds: ["navy", "cyan", "emerald", "lime", "violet", "purple", "crimson", "amber"],
    sequenceLength: 8,
    stepSpeedMs: 480,
    gridColsClass: "grid-cols-2 sm:grid-cols-4 max-w-xl mx-auto",
    description: {
      en: "8 pads • 8-step sequence • Rapid tempo (0.48s)",
      bn: "৮টি বোতাম • ৮ ধাপের সিকোয়েন্স • দ্রুত গতি (০.৪৮ সে.)",
      hi: "8 बटन • 8 चरणों का क्रम • तेज गति (0.48 से.)"
    }
  }
};

export const COMPLETE_PATTERN_CONFIG: Record<NormalizedDifficulty, CompletePatternConfig> = {
  beginner: {
    puzzleCount: 5,
    timeLimitSeconds: 30,
    optionsCount: 4,
    description: {
      en: "5 puzzles • 30s per puzzle • Simple repeating patterns (ABAB, AABB)",
      bn: "৫টি ধাঁধা • প্রতিটি ৩০ সেকেন্ড • সহজ পুনরাবৃত্তি প্যাটার্ন",
      hi: "5 पहेलियां • 30 सेकंड प्रति पहेली • सरल दोहराव पैटर्न"
    }
  },
  moderate: {
    puzzleCount: 8,
    timeLimitSeconds: 20,
    optionsCount: 4,
    description: {
      en: "8 puzzles • 20s per puzzle • Multi-attribute & alternating rules",
      bn: "৮টি ধাঁধা • প্রতিটি ২০ সেকেন্ড • রঙ ও আকারের পরিবর্তন",
      hi: "8 पहेलियां • 20 सेकंड प्रति पहेली • बहु-गुण और एकांतर नियम"
    }
  },
  pro: {
    puzzleCount: 12,
    timeLimitSeconds: 15,
    optionsCount: 4,
    description: {
      en: "12 puzzles • 15s per puzzle • Advanced matrix, rotation & symmetry",
      bn: "১২টি ধাঁধা • প্রতিটি ১৫ সেকেন্ড • ঘূর্ণন, ম্যাট্রিক্স ও প্রতিসাম্য",
      hi: "12 पहेलियां • 15 सेकंड प्रति पहेली • उन्नत मैट्रिक्स, घूर्णन और समरूपता"
    }
  }
};

export const ALL_RHYTHM_TILES: Record<string, RhythmPadItem> = {
  blue: {
    id: "blue",
    name: { en: "Blue", bn: "নীল", hi: "नीला" },
    color: "#2563eb",
    bgLight: "#dbeafe",
    activeBg: "#1d4ed8",
    borderClass: "border-blue-500",
    symbol: "🔵",
    frequency: 261.63 // C4
  },
  yellow: {
    id: "yellow",
    name: { en: "Yellow", bn: "হলুদ", hi: "पीला" },
    color: "#ca8a04",
    bgLight: "#fef9c3",
    activeBg: "#a16207",
    borderClass: "border-yellow-500",
    symbol: "🟡",
    frequency: 392.00 // G4
  },
  green: {
    id: "green",
    name: { en: "Green", bn: "সবুজ", hi: "हरा" },
    color: "#16a34a",
    bgLight: "#dcfce7",
    activeBg: "#15803d",
    borderClass: "border-green-500",
    symbol: "🟢",
    frequency: 329.63 // E4
  },
  red: {
    id: "red",
    name: { en: "Red", bn: "লাল", hi: "लाल" },
    color: "#dc2626",
    bgLight: "#fee2e2",
    activeBg: "#b91c1c",
    borderClass: "border-red-500",
    symbol: "🔴",
    frequency: 440.00 // A4
  },
  amber: {
    id: "amber",
    name: { en: "Amber Gold", bn: "অ্যাম্বার", hi: "अंबर पीला" },
    color: "#d97706",
    bgLight: "#fef3c7",
    activeBg: "#b45309",
    borderClass: "border-amber-500",
    symbol: "⭐",
    frequency: 349.23 // F4
  },
  purple: {
    id: "purple",
    name: { en: "Deep Purple", bn: "বেগুনি", hi: "गहरा बैंगनी" },
    color: "#9333ea",
    bgLight: "#f3e8ff",
    activeBg: "#7e22ce",
    borderClass: "border-purple-500",
    symbol: "🟣",
    frequency: 523.25 // C5
  },
  navy: {
    id: "navy",
    name: { en: "Navy Blue", bn: "গাঢ় নীল", hi: "गहरा नीला" },
    color: "#1e3a8a",
    bgLight: "#dbeafe",
    activeBg: "#172554",
    borderClass: "border-blue-900",
    symbol: "🫐",
    frequency: 261.63 // C4
  },
  cyan: {
    id: "cyan",
    name: { en: "Cyan / Sky", bn: "আকাশি", hi: "आसमानी" },
    color: "#06b6d4",
    bgLight: "#cffafe",
    activeBg: "#0891b2",
    borderClass: "border-cyan-500",
    symbol: "🩵",
    frequency: 293.66 // D4
  },
  emerald: {
    id: "emerald",
    name: { en: "Emerald", bn: "পান্না সবুজ", hi: "पन्ना हरा" },
    color: "#059669",
    bgLight: "#d1fae5",
    activeBg: "#047857",
    borderClass: "border-emerald-600",
    symbol: "🟩",
    frequency: 329.63 // E4
  },
  lime: {
    id: "lime",
    name: { en: "Lime", bn: "লেবু সবুজ", hi: "नींबू हरा" },
    color: "#84cc16",
    bgLight: "#ecfccb",
    activeBg: "#65a30d",
    borderClass: "border-lime-500",
    symbol: "🍏",
    frequency: 369.99 // F#4
  },
  violet: {
    id: "violet",
    name: { en: "Violet", bn: "নীললোহিত", hi: "हल्का बैंगनी" },
    color: "#7c3aed",
    bgLight: "#ede9fe",
    activeBg: "#6d28d9",
    borderClass: "border-violet-500",
    symbol: "🪻",
    frequency: 493.88 // B4
  },
  crimson: {
    id: "crimson",
    name: { en: "Crimson", bn: "রক্তিম লাল", hi: "गहरा लाल" },
    color: "#b91c1c",
    bgLight: "#fee2e2",
    activeBg: "#991b1b",
    borderClass: "border-rose-600",
    symbol: "🏮",
    frequency: 440.00 // A4
  }
};

/**
 * Normalizes any legacy "advanced" difficulty value to "pro".
 */
export function normalizeDifficulty(diff: DifficultyLevel): NormalizedDifficulty {
  if (diff === "advanced") return "pro";
  if (diff === "moderate") return "moderate";
  if (diff === "pro") return "pro";
  return "beginner";
}

/**
 * Returns localized difficulty label.
 */
export function getDifficultyLabel(diff: DifficultyLevel, lang: Language): string {
  const norm = normalizeDifficulty(diff);
  return DIFFICULTY_TIERS[norm].name[lang] || DIFFICULTY_TIERS[norm].name.en;
}

/**
 * Returns the badge styling for a difficulty level.
 */
export function getDifficultyBadge(diff: DifficultyLevel) {
  const norm = normalizeDifficulty(diff);
  return DIFFICULTY_TIERS[norm];
}
