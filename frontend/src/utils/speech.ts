import { Locale } from "../i18n/translations";

export type SpeechGender = "female" | "male";

export interface VoicePreference {
  gender: SpeechGender;
}

export const getLocaleCode = (lang: Locale): string => {
  switch (lang) {
    case "bn":
      return "bn-IN";
    case "hi":
      return "hi-IN";
    case "en":
    default:
      return "en-IN";
  }
};

/**
 * Voice selection algorithm conforming to spec:
 * (1) match language
 * (2) prefer regional xx-IN
 * (3) match saved male/female preference using real voice names
 * (4) closest compatible voice
 * (5) silent graceful fallback if none
 */
export const selectBestVoice = (
  voices: SpeechSynthesisVoice[],
  lang: Locale,
  preferredGender: SpeechGender = "female"
): SpeechSynthesisVoice | null => {
  if (!voices || voices.length === 0) return null;

  const targetLang = getLocaleCode(lang).toLowerCase(); // e.g. "en-in", "hi-in", "bn-in"
  const langPrefix = lang.toLowerCase(); // e.g. "en", "hi", "bn"

  // 1. Filter voices that match this language
  const matchingVoices = voices.filter((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang === targetLang || vLang.startsWith(langPrefix);
  });

  if (matchingVoices.length === 0) {
    // Graceful fallback to default voice or first available
    return voices.find((v) => v.default) || voices[0] || null;
  }

  // 2. Prioritize regional xx-IN match
  const regionalVoices = matchingVoices.filter((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang.includes("in");
  });

  const pool = regionalVoices.length > 0 ? regionalVoices : matchingVoices;

  // 3. Match preferred gender if detectable in voice name
  const genderKeywords =
    preferredGender === "female"
      ? ["female", "woman", "girl", "zira", "priya", "kalpana", "aditi", "veena", "sangeeta", "geeta", "swara"]
      : ["male", "man", "boy", "david", "rishi", "neer", "madhav", "hemant", "ravi", "kunal"];

  const genderMatched = pool.find((v) => {
    const nameLower = v.name.toLowerCase();
    return genderKeywords.some((kw) => nameLower.includes(kw));
  });

  if (genderMatched) {
    return genderMatched;
  }

  // Fallback to highest quality / default in pool
  return pool.find((v) => v.localService) || pool[0];
};
