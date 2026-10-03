import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useLanguage } from "./LanguageContext";
import {
  SpeechGender,
  speakWithFallback,
  ActivePlaybackHandle,
} from "../utils/speech";

interface SpeechContextType {
  speak: (text: string, id?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  activeId: string | null;
  speechGender: SpeechGender;
  setSpeechGender: (gender: SpeechGender) => void;
  hasVoices: boolean;
}

const GENDER_KEY = "recalled-voice-gender";

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const activeHandleRef = useRef<ActivePlaybackHandle | null>(null);

  const [speechGender, setSpeechGenderState] = useState<SpeechGender>(() => {
    try {
      const saved = localStorage.getItem(GENDER_KEY);
      return saved === "male" ? "male" : "female";
    } catch {
      return "female";
    }
  });

  const setSpeechGender = (gender: SpeechGender) => {
    setSpeechGenderState(gender);
    try {
      localStorage.setItem(GENDER_KEY, gender);
    } catch {
      // Ignore
    }
  };

  // Populate browser voices and listen for voiceschanged (for browser fallback)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (activeHandleRef.current) {
      activeHandleRef.current.stop();
      activeHandleRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveId(null);
  }, []);

  const pause = useCallback(() => {
    if (activeHandleRef.current) {
      activeHandleRef.current.pause();
    } else if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (activeHandleRef.current) {
      activeHandleRef.current.resume();
    } else if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setIsPaused(false);
  }, []);

  // Stop speech when language changes
  useEffect(() => {
    stop();
  }, [language, stop]);

  // Clean up all audio/speech resources on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const speak = useCallback(
    (text: string, id: string = "default") => {
      const cleanText = text.trim();
      if (!cleanText) return;

      // If already playing this item, toggle pause/resume
      if (activeId === id && isSpeaking) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
        return;
      }

      // Stop any prior speech (strict one-readout-at-a-time rule)
      stop();

      setActiveId(id);
      setIsSpeaking(true);
      setIsPaused(false);

      const handle = speakWithFallback({
        text: cleanText,
        language,
        preferredGender: speechGender,
        voices,
        onStart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
          setActiveId(id);
        },
        onPause: () => {
          setIsPaused(true);
        },
        onResume: () => {
          setIsPaused(false);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveId((curr) => (curr === id ? null : curr));
          activeHandleRef.current = null;
        },
        onError: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveId((curr) => (curr === id ? null : curr));
          activeHandleRef.current = null;
        },
      });

      activeHandleRef.current = handle;
    },
    [activeId, isSpeaking, isPaused, language, speechGender, voices, stop, pause, resume]
  );

  return (
    <SpeechContext.Provider
      value={{
        speak,
        pause,
        resume,
        stop,
        isSpeaking,
        isPaused,
        activeId,
        speechGender,
        setSpeechGender,
        hasVoices: voices.length > 0 || true
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = (): SpeechContextType => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
