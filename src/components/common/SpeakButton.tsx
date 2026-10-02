import React from "react";
import { Volume2, Pause, Play } from "lucide-react";
import { useSpeech } from "../../contexts/SpeechContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface SpeakButtonProps {
  text: string;
  id: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  id,
  size = "md",
  className = "",
  showLabel = false
}) => {
  const { speak, isSpeaking, isPaused, activeId } = useSpeech();
  const { t } = useLanguage();

  const isCurrentActive = activeId === id;
  const isCurrentlyPlaying = isCurrentActive && isSpeaking && !isPaused;
  const isCurrentlyPaused = isCurrentActive && isSpeaking && isPaused;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(text, id);
  };

  // Determine Icon and Label based on strict 3-state spec:
  // Idle: Volume2 ("Read aloud")
  // Playing: Pause ("Pause")
  // Paused: Play ("Resume")
  let Icon = Volume2;
  let label = t("speech.readAloud");

  if (isCurrentlyPlaying) {
    Icon = Pause;
    label = t("speech.pause");
  } else if (isCurrentlyPaused) {
    Icon = Play;
    label = t("speech.resume");
  }

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const buttonPaddings = {
    sm: "p-1.5 text-xs",
    md: "p-2 text-sm",
    lg: "p-2.5 text-base"
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`speak-btn inline-flex items-center gap-1.5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 select-none ${
        isCurrentlyPlaying
          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
          : isCurrentlyPaused
          ? "bg-amber-500 text-white shadow-sm"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
      } ${buttonPaddings[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span className="font-medium text-xs sm:text-sm">{label}</span>}
    </button>
  );
};
