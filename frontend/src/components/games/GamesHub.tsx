import React, { useState } from "react";
import { Play, Sparkles, Brain, Award } from "lucide-react";
import { GameId } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getDomainRecommendations } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";
import { MemoryMatchGame } from "./MemoryMatchGame";
import { PatternRhythmGame } from "./PatternRhythmGame";
import { FamilyRecallGame } from "./FamilyRecallGame";
import { MemoryLaneGame } from "./MemoryLaneGame";
import { CompleteThePatternGame } from "./CompleteThePatternGame";

interface GamesHubProps {
  patientId: string;
}

export const GamesHub: React.FC<GamesHubProps> = ({ patientId }) => {
  const { t } = useLanguage();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const { weakestDomain } = getDomainRecommendations(patientId);

  const gamesConfig: {
    id: GameId;
    titleKey: string;
    domainKey: string;
    description: string;
    icon: string;
    color: string;
    bgBadge: string;
    textBadge: string;
  }[] = [
    {
      id: "memory_match",
      titleKey: "game.memoryMatch.title",
      domainKey: "games.domain.memoryAttention",
      description: "Flip cards and match pairs of familiar Indian icons (Diya, Peacock, Lotus, Auto-rickshaw).",
      icon: "🪔",
      color: "from-blue-600 to-indigo-700",
      bgBadge: "bg-blue-100",
      textBadge: "text-blue-800"
    },
    {
      id: "pattern_rhythm",
      titleKey: "game.patternRhythm.title",
      domainKey: "games.domain.patternRhythm",
      description: "Watch a rhythmic sequence of vibrant colors and reproduce it step-by-step.",
      icon: "🎵",
      color: "from-indigo-600 to-purple-700",
      bgBadge: "bg-indigo-100",
      textBadge: "text-indigo-800"
    },
    {
      id: "family_recall",
      titleKey: "game.familyRecall.title",
      domainKey: "games.domain.familyRecall",
      description: "Look at family photos and autobiographical moments to remember loved ones and events.",
      icon: "🖼️",
      color: "from-rose-600 to-pink-700",
      bgBadge: "bg-rose-100",
      textBadge: "text-rose-800"
    },
    {
      id: "memory_lane",
      titleKey: "game.memoryLane.title",
      domainKey: "games.domain.recall",
      description: "Recall memorable Indian cinema, music, cricket, Doordarshan, and cultural heritage.",
      icon: "📻",
      color: "from-amber-600 to-orange-700",
      bgBadge: "bg-amber-100",
      textBadge: "text-amber-800"
    },
    {
      id: "complete_the_pattern",
      titleKey: "game.completePattern.title",
      domainKey: "games.domain.patternRecognition",
      description: "Observe geometric and color sequences, infer the guiding rule, and pick what comes next.",
      icon: "🧩",
      color: "from-teal-600 to-emerald-700",
      bgBadge: "bg-teal-100",
      textBadge: "text-teal-800"
    }
  ];

  if (activeGame === "memory_match") {
    return <MemoryMatchGame patientId={patientId} onClose={() => setActiveGame(null)} />;
  }
  if (activeGame === "pattern_rhythm") {
    return <PatternRhythmGame patientId={patientId} onClose={() => setActiveGame(null)} />;
  }
  if (activeGame === "family_recall") {
    return <FamilyRecallGame patientId={patientId} onClose={() => setActiveGame(null)} />;
  }
  if (activeGame === "memory_lane") {
    return <MemoryLaneGame patientId={patientId} onClose={() => setActiveGame(null)} />;
  }
  if (activeGame === "complete_the_pattern") {
    return <CompleteThePatternGame patientId={patientId} onClose={() => setActiveGame(null)} />;
  }

  const hubTitle = t("games.hub.title");
  const hubSub = t("games.hub.sub");

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{hubTitle}</h1>
            <SpeakButton text={`${hubTitle}. ${hubSub}`} id="games-hub-speak" size="sm" />
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">{hubSub}</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 text-xs sm:text-sm text-blue-800 font-medium">
          <Brain className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Non-diagnostic, elder-friendly cognitive workouts</span>
        </div>
      </div>

      {/* Recommended Game Banner */}
      {weakestDomain && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold block">
                {t("patient.dashboard.recommendation")}
              </span>
              <p className="font-semibold text-base sm:text-lg">
                Focus Area: {weakestDomain.domain}
              </p>
              <p className="text-xs text-blue-100">
                Gentle practice in this area supports cognitive balance today.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveGame(weakestDomain.recommendedGameId)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            {t("patient.dashboard.recommendationBtn")}
          </button>
        </div>
      )}

      {/* Grid of 5 Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {gamesConfig.map((game) => {
          const isRecommended = weakestDomain?.recommendedGameId === game.id;
          const title = t(game.titleKey);
          const domain = t(game.domainKey);

          return (
            <div
              key={game.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                isRecommended ? "border-blue-400 ring-2 ring-blue-100 shadow-sm" : "border-slate-200"
              }`}
            >
              <div>
                {/* Domain & Recommendation Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${game.bgBadge} ${game.textBadge}`}
                  >
                    {domain}
                  </span>
                  {isRecommended && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      <Award className="w-3 h-3 text-amber-600" />
                      Recommended
                    </span>
                  )}
                </div>

                {/* Title & Icon */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{game.icon}</span>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {title}
                    <SpeakButton text={`${title}. Domain: ${domain}. ${game.description}`} id={`game-card-${game.id}`} size="sm" />
                  </h3>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setActiveGame(game.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                {t("games.play")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
