import React from "react";
import { ArrowLeft, Play, Check, Sparkles } from "lucide-react";
import { GameId, Language } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  DIFFICULTY_TIERS,
  MEMORY_MATCH_CONFIG,
  PATTERN_RHYTHM_CONFIG,
  COMPLETE_PATTERN_CONFIG,
  NormalizedDifficulty
} from "../../data/difficultyConfig";
import { SpeakButton } from "../common/SpeakButton";

interface DifficultySelectorProps {
  gameId: GameId;
  selectedDifficulty: NormalizedDifficulty;
  onSelectDifficulty: (diff: NormalizedDifficulty) => void;
  onStart: () => void;
  title: string;
  domain: string;
  instruction: string;
  onClose: () => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  gameId,
  selectedDifficulty,
  onSelectDifficulty,
  onStart,
  title,
  domain,
  instruction,
  onClose
}) => {
  const { language } = useLanguage();
  const lang = (language || "en") as Language;

  const tiers: NormalizedDifficulty[] = ["beginner", "moderate", "pro"];

  const getGameSpecificDetails = (diff: NormalizedDifficulty): string => {
    if (gameId === "memory_match") {
      const cfg = MEMORY_MATCH_CONFIG[diff];
      return cfg.description[lang] || cfg.description.en;
    }
    if (gameId === "pattern_rhythm") {
      const cfg = PATTERN_RHYTHM_CONFIG[diff];
      return cfg.description[lang] || cfg.description.en;
    }
    if (gameId === "complete_the_pattern") {
      const cfg = COMPLETE_PATTERN_CONFIG[diff];
      return cfg.description[lang] || cfg.description.en;
    }
    return "";
  };

  const getDifficultyTitle = (diff: NormalizedDifficulty): string => {
    const tier = DIFFICULTY_TIERS[diff];
    return tier.name[lang] || tier.name.en;
  };

  const selectDifficultyHeader =
    lang === "bn"
      ? "কঠিনতার মাত্রা নির্বাচন করুন"
      : lang === "hi"
      ? "कठिनाई का स्तर चुनें"
      : "Select Difficulty";

  const startGameLabel =
    lang === "bn"
      ? "খেলা শুরু করুন"
      : lang === "hi"
      ? "खेल शुरू करें"
      : "Start Game";

  const cognitiveChallengeLabel =
    lang === "bn"
      ? "মানসিক দক্ষতা লক্ষ্য:"
      : lang === "hi"
      ? "संज्ञानात्मक लक्ष्य:"
      : "Cognitive Focus:";

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-1">
            {domain}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {title}
            <SpeakButton text={`${title}. ${instruction}. ${selectDifficultyHeader}`} id="diff-sel-title" size="sm" />
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">{instruction}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === "bn" ? "ফিরে যান" : lang === "hi" ? "वापस" : "Back"}</span>
        </button>
      </div>

      {/* Select Difficulty Section */}
      <div className="my-6">
        <div className="text-center mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <span>{selectDifficultyHeader}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === "bn"
              ? "আপনার সুবিধাজনক স্তরটি বেছে নিন এবং প্রস্তুত হলে শুরু করুন"
              : lang === "hi"
              ? "अपनी सुविधा अनुसार स्तर चुनें और तैयार होने पर शुरू करें"
              : "Choose the challenge level best suited for you today"}
          </p>
        </div>

        {/* 3 Difficulty Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiers.map((tierKey) => {
            const tier = DIFFICULTY_TIERS[tierKey];
            const isSelected = selectedDifficulty === tierKey;
            const details = getGameSpecificDetails(tierKey);

            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => onSelectDifficulty(tierKey)}
                className={`relative flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100 scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                }`}
              >
                {/* Selected Indicator Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl select-none" aria-hidden="true">{tier.badgeIcon}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {getDifficultyTitle(tierKey)}
                  </span>
                </div>

                {/* Game Parameters Summary */}
                <div className="my-2 p-2 rounded-lg bg-white/80 border border-slate-200/70 text-xs font-semibold text-slate-700">
                  {details}
                </div>

                {/* Challenge description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                  {tier.tagline[lang] || tier.tagline.en}
                </p>

                {/* Cognitive Focus Note */}
                <div className="mt-auto pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    {cognitiveChallengeLabel}
                  </span>
                  <span className="italic">{tier.cognitiveFocus[lang] || tier.cognitiveFocus.en}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onStart}
          className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-base font-bold shadow-sm transition-all cursor-pointer hover:shadow-md"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{startGameLabel}</span>
        </button>
      </div>
    </div>
  );
};
