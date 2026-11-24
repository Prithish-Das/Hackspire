import { MemoryAlbumItem, MemoryLaneMemory, Patient, PatientInterests } from "../types";
import { MemoryLaneQuestion } from "../data/questions/memoryLaneQuestions";

export const INTEREST_OPTIONS = {
  sports: ["Cricket", "Football", "Badminton", "Tennis", "Hockey", "Other"] as const,
  entertainment: ["Music", "Movies", "Television", "Cartoons", "Reading", "Other hobbies"] as const,
  lifestyle: [
    "Gardening",
    "Cooking",
    "Travelling",
    "Religious or cultural activities",
    "Local festivals and traditions"
  ] as const
};

export const UNCOMFORTABLE_TOPIC_SUGGESTIONS = [
  "Hospital or medical scenes",
  "Conflict or war",
  "Loud crowds",
  "Politics",
  "Bereavement or loss",
  "Sad news"
] as const;

// Common multilingual equivalents so exclusions work reliably across EN / BN / HI content
const TOPIC_SYNONYMS: Record<string, string[]> = {
  cricket: ["cricket", "ক্রিকেট", "क्रिकेट", "world cup", "kapil dev"],
  football: ["football", "soccer", "ফুটবল", "फुटबॉल", "banerjee", "goswami"],
  movies: ["movie", "movies", "cinema", "film", "চলচ্চিত্র", "সিনেমা", "फ़िल्म", "सिनेमा", "sholay", "ray"],
  cinema: ["movie", "movies", "cinema", "film", "চলচ্চিত্র", "সিনেমা", "फ़िल्म", "सिनेमा"],
  television: ["television", "tv", "doordarshan", "serial", "দূরদর্শন", "दूरदर्शन", "ramayan", "धारावाहिक"],
  music: ["music", "song", "singer", "radio", "সঙ্গীত", "গান", "संगीत", "गीत", "गायिका", "mangeshkar", "vividh bharati"],
  gardening: ["garden", "gardening", "plant", "tree", "botanic", "বাগান", "গাছ", "बगीचा", "पेड़"],
  cooking: ["cook", "cooking", "spice", "kitchen", "culinary", "রান্না", "মশলা", "रसोई", "मसाला"],
  festivals: ["festival", "puja", "diwali", "holi", "উৎসব", "পূজা", "त्योहार"],
  religious: ["religious", "temple", "ramayan", "mahabharat", "পৌরাণিক", "मंदिर", "रामायण"]
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function expandTermWithSynonyms(term: string): string[] {
  const norm = normalizeText(term);
  if (!norm) return [];
  const expanded = new Set<string>([norm]);

  Object.entries(TOPIC_SYNONYMS).forEach(([key, synonyms]) => {
    if (norm === key || norm.includes(key) || synonyms.some((s) => s === norm)) {
      expanded.add(key);
      synonyms.forEach((s) => expanded.add(s));
    }
  });

  return Array.from(expanded);
}

/**
 * Combines all explicit dislikes and exclusion rules into a deduplicated list.
 * Dislikes are stored strictly separately from favourite interests.
 */
export function extractExclusionTerms(patient?: Patient | null): string[] {
  if (!patient?.dislikes) return [];

  const rawTerms = [
    ...(patient.dislikes.dislikedSportsOrTeams || []),
    ...(patient.dislikes.dislikedEntertainment || []),
    ...(patient.dislikes.uncomfortableTopics || []),
    ...(patient.dislikes.excludedPeopleOrSubjects || []),
    ...(patient.dislikes.otherExclusions || [])
  ];

  const unique = new Set<string>();
  rawTerms.forEach((term) => {
    const clean = normalizeText(term);
    if (clean) {
      unique.add(clean);
    }
  });

  return Array.from(unique);
}

/**
 * Checks whether a piece of content matches any explicit patient exclusion.
 * Treats explicit dislikes as strong exclusion rules.
 */
export function isContentAllowed(
  textParts: (string | undefined)[],
  patient?: Patient | null
): boolean {
  const exclusions = extractExclusionTerms(patient);
  if (exclusions.length === 0) return true;

  const combined = textParts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .toLowerCase();

  if (!combined) return true;

  for (const rawTerm of exclusions) {
    const variants = expandTermWithSynonyms(rawTerm);
    for (const variant of variants) {
      if (variant.length >= 2 && combined.includes(variant)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Collects all stated favourite interests (structured + legacy array) for positive ranking.
 */
export function collectInterestTerms(patient?: Patient | null): string[] {
  if (!patient) return [];
  const si: Partial<PatientInterests> = patient.structuredInterests || {};
  const combined = [
    ...(si.sports || []),
    ...(si.entertainment || []),
    ...(si.lifestyle || []),
    ...(si.custom || []),
    ...(patient.interests || [])
  ];

  const terms = new Set<string>();
  combined.forEach((t) => {
    const norm = normalizeText(t);
    if (norm && norm !== "other" && norm !== "other hobbies") {
      terms.add(norm);
    }
  });
  return Array.from(terms);
}

function getLocationTerms(patient?: Patient | null): string[] {
  if (!patient) return [];
  const raw = [patient.city, patient.state, patient.region]
    .filter((v): v is string => Boolean(v && v.trim()))
    .join(" ")
    .toLowerCase();

  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  // Add gentle regional context for major cities without religious/ethnic assumptions
  if (raw.includes("kolkata") || raw.includes("west bengal")) {
    tokens.push("bengal", "eastern india", "howrah");
  }
  return Array.from(new Set(tokens));
}

function computeMatchScore(textParts: (string | undefined)[], patient?: Patient | null): number {
  if (!patient) return 0;
  const combined = textParts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .toLowerCase();

  let score = 0;

  // Interest boost
  const interests = collectInterestTerms(patient);
  for (const interest of interests) {
    const variants = expandTermWithSynonyms(interest);
    if (variants.some((v) => combined.includes(v))) {
      score += 3;
    }
  }

  // City / State gentle local cultural context boost
  const locationTerms = getLocationTerms(patient);
  for (const loc of locationTerms) {
    if (combined.includes(loc)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Filters Memory Lane quiz questions using strong dislike exclusion,
 * then prioritizes questions aligned with patient interests and local context.
 */
export function filterMemoryLaneQuestions(
  questions: MemoryLaneQuestion[],
  patient?: Patient | null
): MemoryLaneQuestion[] {
  const allowed = questions.filter((q) => {
    const textParts = [
      q.category,
      q.era,
      q.region,
      q.question.en,
      q.question.bn,
      q.question.hi,
      ...(q.options.en || []),
      ...(q.options.bn || []),
      ...(q.options.hi || [])
    ];
    return isContentAllowed(textParts, patient);
  });

  // Sort by personal relevance score while preserving variety among equal scores
  return [...allowed].sort((a, b) => {
    const scoreA = computeMatchScore(
      [a.category, a.era, a.region, a.question.en, ...(a.options.en || [])],
      patient
    );
    const scoreB = computeMatchScore(
      [b.category, b.era, b.region, b.question.en, ...(b.options.en || [])],
      patient
    );
    return scoreB - scoreA;
  });
}

/**
 * Filters Memory Album items for Family Recall game:
 * - Respects familyInfo.allowInGames consent for family-category items
 * - Enforces strong exclusions on person, relationship, title, and description
 */
export function filterMemoryAlbumForGames(
  items: MemoryAlbumItem[],
  patient?: Patient | null
): MemoryAlbumItem[] {
  const allowFamilyInGames = patient?.familyInfo?.allowInGames !== false;

  return items.filter((item) => {
    if (item.category === "family" && !allowFamilyInGames) {
      return false;
    }
    return isContentAllowed(
      [item.title, item.person, item.relationship, item.description, item.category],
      patient
    );
  });
}

/**
 * Returns consented, non-excluded family names from onboarding/profile
 * to personalize Family Recall answer options gently.
 */
export function getConsentedFamilyDistractors(
  patient: Patient | null | undefined,
  excludeAnswer: string
): string[] {
  if (!patient?.familyInfo || patient.familyInfo.allowInGames === false) {
    return [];
  }

  const candidates: string[] = [];
  if (patient.familyInfo.spouse?.name?.trim()) {
    const detail = patient.familyInfo.spouse.relationDetail?.trim();
    candidates.push(
      detail
        ? `${patient.familyInfo.spouse.name.trim()} (${detail})`
        : patient.familyInfo.spouse.name.trim()
    );
  }

  (patient.familyInfo.children || []).forEach((c) => {
    if (c.name?.trim()) {
      const detail = c.relationDetail?.trim();
      candidates.push(detail ? `${c.name.trim()} (${detail})` : c.name.trim());
    }
  });

  (patient.familyInfo.grandchildren || []).forEach((g) => {
    if (g.name?.trim()) {
      const detail = g.relationDetail?.trim();
      candidates.push(detail ? `${g.name.trim()} (${detail})` : g.name.trim());
    }
  });

  const lowerExclude = excludeAnswer.trim().toLowerCase();
  return candidates.filter((label) => {
    const baseName = label.split("(")[0].trim().toLowerCase();
    if (!baseName || lowerExclude.includes(baseName) || baseName.includes(lowerExclude)) {
      return false;
    }
    return isContentAllowed([label], patient);
  });
}

/**
 * Filters Memory Lane Timeline memories against patient exclusions
 * and prioritizes memories matching patient interests or city/state.
 */
export function filterTimelineMemories(
  memories: MemoryLaneMemory[],
  patient?: Patient | null
): MemoryLaneMemory[] {
  const allowed = memories.filter((mem) =>
    isContentAllowed([mem.title, mem.culturalCategory, mem.location, mem.description], patient)
  );

  return [...allowed].sort((a, b) => {
    const sA = computeMatchScore([a.title, a.culturalCategory, a.location, a.description], patient);
    const sB = computeMatchScore([b.title, b.culturalCategory, b.location, b.description], patient);
    return sB - sA;
  });
}
