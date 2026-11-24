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
 * Voice selection algorithm for browser Web Speech fallback:
 * (1) match language
 * (2) prefer regional xx-IN
 * (3) match saved male/female preference using voice names
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

export interface SpeechPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface SpeechPlaybackOptions extends SpeechPlaybackCallbacks {
  text: string;
  language: Locale;
  preferredGender?: SpeechGender;
  voices?: SpeechSynthesisVoice[];
}

export interface ActivePlaybackHandle {
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isPaused: () => boolean;
}

/**
 * Attempts to fetch audio stream from backend /api/tts proxy.
 * Returns Blob on success, or null on failure (for silent fallback).
 */
export async function fetchBackendTtsAudio(
  text: string,
  lang: Locale,
  gender: SpeechGender = "female",
  signal?: AbortSignal
): Promise<Blob | null> {
  const clean = text.trim();
  if (!clean || clean.length > 400) {
    return null;
  }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: clean,
        language: lang,
        gender,
      }),
      signal,
    });

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("audio") && !contentType.includes("octet-stream")) {
      return null;
    }

    return await res.blob();
  } catch {
    // Network error, abort, or offline -> silent fallback
    return null;
  }
}

/**
 * Speaks text using the ElevenLabs backend proxy (/api/tts) first.
 * If backend fails or is unavailable for any reason, silently and seamlessly falls
 * back to the existing browser text-to-speech behavior.
 * Enforces resource cleanup for object URLs and audio instances.
 */
export const speakWithFallback = (
  options: SpeechPlaybackOptions
): ActivePlaybackHandle => {
  const cleanText = options.text.trim();
  let stopped = false;
  let paused = false;
  let activeAudio: HTMLAudioElement | null = null;
  let activeObjectUrl: string | null = null;
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let isUsingBrowserFallback = false;
  const abortController = new AbortController();

  const cleanupAudio = () => {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.onplay = null;
        activeAudio.onpause = null;
        activeAudio.onended = null;
        activeAudio.onerror = null;
        activeAudio.src = "";
      } catch {
        // Ignore audio cleanup errors
      }
      activeAudio = null;
    }
    if (activeObjectUrl) {
      try {
        URL.revokeObjectURL(activeObjectUrl);
      } catch {
        // Ignore object URL cleanup errors
      }
      activeObjectUrl = null;
    }
  };

  const fallbackToBrowser = () => {
    if (stopped) return;
    cleanupAudio();
    isUsingBrowserFallback = true;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options.onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = getLocaleCode(options.language);

      const voice = selectBestVoice(
        options.voices || (window.speechSynthesis.getVoices() || []),
        options.language,
        options.preferredGender || "female"
      );
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (stopped) {
          window.speechSynthesis.cancel();
          return;
        }
        options.onStart?.();
      };

      utterance.onpause = () => {
        if (!stopped) {
          options.onPause?.();
        }
      };

      utterance.onresume = () => {
        if (!stopped) {
          options.onResume?.();
        }
      };

      utterance.onend = () => {
        activeUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        activeUtterance = null;
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("Speech synthesis notice:", e.error);
        }
        options.onEnd?.();
      };

      activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Browser speech fallback failed:", err);
      options.onEnd?.();
    }
  };

  if (!cleanText) {
    options.onEnd?.();
    return {
      pause: () => {},
      resume: () => {},
      stop: () => {},
      isPaused: () => false,
    };
  }

  // If text is longer than 400 characters, bypass backend directly to browser fallback
  if (cleanText.length > 400) {
    fallbackToBrowser();
  } else {
    // Notify start so UI immediately enters reading/playing state
    options.onStart?.();

    fetchBackendTtsAudio(
      cleanText,
      options.language,
      options.preferredGender || "female",
      abortController.signal
    )
      .then(async (blob) => {
        if (stopped) return;

        if (!blob) {
          fallbackToBrowser();
          return;
        }

        try {
          const objectUrl = URL.createObjectURL(blob);
          activeObjectUrl = objectUrl;
          const audio = new Audio(objectUrl);
          activeAudio = audio;

          audio.onpause = () => {
            if (!stopped) {
              options.onPause?.();
            }
          };

          audio.onended = () => {
            cleanupAudio();
            options.onEnd?.();
          };

          audio.onerror = () => {
            cleanupAudio();
            fallbackToBrowser();
          };

          if (paused) {
            audio.pause();
          } else {
            await audio.play();
          }
        } catch {
          // Playback or autoplay exception -> fallback to browser
          fallbackToBrowser();
        }
      })
      .catch(() => {
        if (!stopped) {
          fallbackToBrowser();
        }
      });
  }

  return {
    pause: () => {
      if (stopped) return;
      paused = true;
      if (activeAudio) {
        activeAudio.pause();
      } else if (isUsingBrowserFallback && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      options.onPause?.();
    },
    resume: () => {
      if (stopped) return;
      paused = false;
      if (activeAudio) {
        activeAudio.play().catch(() => {
          fallbackToBrowser();
        });
      } else if (isUsingBrowserFallback && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
      }
      options.onResume?.();
    },
    stop: () => {
      stopped = true;
      paused = false;
      try {
        abortController.abort();
      } catch {
        // Ignore
      }
      cleanupAudio();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
      activeUtterance = null;
      options.onEnd?.();
    },
    isPaused: () => paused,
  };
};
