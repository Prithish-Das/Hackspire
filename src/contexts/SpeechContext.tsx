import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useLanguage } from "./LanguageContext";
import { selectBestVoice, SpeechGender, getLocaleCode } from "../utils/speech";

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
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Populate voices and listen for voiceschanged
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

  // Stop speech when language changes
  useEffect(() => {
    stop();
  }, [language]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveId(null);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, id: string = "default") => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      const cleanText = text.trim();
      if (!cleanText) return;

      // If already playing this item, toggle pause
      if (activeId === id && isSpeaking) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
        return;
      }

      // Stop any prior speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95; // Spec: ~0.95 rate
      utterance.pitch = 1.0;
      utterance.lang = getLocaleCode(language);

      const voice = selectBestVoice(voices, language, speechGender);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveId(id);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveId(null);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        // Silent graceful fallback, don't crash
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("Speech synthesis notice:", e.error);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveId(null);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [activeId, isSpeaking, isPaused, language, voices, speechGender, pause, resume]
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
        hasVoices: voices.length > 0
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
