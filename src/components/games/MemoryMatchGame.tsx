import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2, Sliders, Zap } from "lucide-react";
import { MATCH_ITEMS, MatchCardItem } from "../../data/memoryMatchAssets";
import { DifficultyLevel, GameId, GameSession, Language } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty, getDomainRecommendations } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";
import { submitGameResultToBackend } from "../../services/gameApi";
import { DifficultySelector } from "./DifficultySelector";
import {
  MEMORY_MATCH_CONFIG,
  DIFFICULTY_TIERS,
  normalizeDifficulty,
  NormalizedDifficulty
} from "../../data/difficultyConfig";

interface CardState {
  uid: string;
  item: MatchCardItem;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  patientId: string;
  onClose: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ patientId, onClose }) => {
  const { t, language } = useLanguage();
  const lang = (language || "en") as Language;
  const { speak } = useSpeech();

  // Difficulty & Pre-game screen state
  const [hasStarted, setHasStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<NormalizedDifficulty>("beginner");

  // Gameplay state
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesFound, setMatchesFound] = useState(0);
  const [totalPairs, setTotalPairs] = useState(3);
  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Memory Preview Countdown state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewRemaining, setPreviewRemaining] = useState(5);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Adaptive & Backend Sync state
  const [adaptiveNote, setAdaptiveNote] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "synced" | "fallback">("idle");
  const [recommendedGame, setRecommendedGame] = useState<GameId | null>(null);
  const [weakestDomainInfo, setWeakestDomainInfo] = useState<{
    domain: string;
    statusLabel: string;
    recommendedGameId: GameId;
    runningAvg: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and start a new game round
  const startNewGame = (diff: NormalizedDifficulty = difficulty) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);

    const config = MEMORY_MATCH_CONFIG[diff];
    const pairsCount = config.pairsCount;
    setTotalPairs(pairsCount);

    // Randomly sample pairsCount unique items from the 16 cultural assets
    const shuffledPool = [...MATCH_ITEMS];
    for (let i = shuffledPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }
    const selectedPool = shuffledPool.slice(0, pairsCount);

    // Build pair cards (face-up during preview phase)
    const deck: CardState[] = [];
    selectedPool.forEach((item, index) => {
      deck.push({ uid: `${item.id}-a-${index}-${Date.now()}`, item, isFlipped: true, isMatched: false });
      deck.push({ uid: `${item.id}-b-${index}-${Date.now()}`, item, isFlipped: true, isMatched: false });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchesFound(0);
    setScore(config.baseScore);
    setTimeTaken(0);
    setAttempts(0);
    setMistakes(0);
    setIsCompleted(false);
    setFeedback(null);
    setAdaptiveNote(null);
    setSyncStatus("idle");
    setRecommendedGame(null);
    setWeakestDomainInfo(null);
    setHasStarted(true);

    // Start memory preview phase
    const previewSecs = config.previewSeconds;
    setPreviewRemaining(previewSecs);
    setIsPreviewing(true);

    let remaining = previewSecs;
    previewTimerRef.current = setInterval(() => {
      remaining -= 1;
      setPreviewRemaining(remaining);
      if (remaining <= 0) {
        if (previewTimerRef.current) clearInterval(previewTimerRef.current);
        endPreviewPhase(deck);
      }
    }, 1000);
  };

  const endPreviewPhase = (currentDeck?: CardState[]) => {
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    setIsPreviewing(false);
    // Flip all unmatched cards face-down
    setCards((prevCards) => {
      const base = currentDeck || prevCards;
      return base.map((c) => ({ ...c, isFlipped: false }));
    });
  };

  // Timer during active gameplay (after preview ends)
  useEffect(() => {
    if (!hasStarted || isPreviewing || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isPreviewing, isCompleted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, []);

  const handleCardClick = (index: number) => {
    if (isCompleted || isPreviewing) return;
    if (flippedIndices.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (soundEnabled) {
      speak(newCards[index].item.name[lang] || newCards[index].item.name.en, `card-${index}`);
    }

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const cardA = newCards[firstIdx];
      const cardB = newCards[secondIdx];
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (cardA.item.id === cardB.item.id) {
        // Matched!
        setTimeout(() => {
          cardA.isMatched = true;
          cardB.isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          const newMatchedCount = matchesFound + 1;
          setMatchesFound(newMatchedCount);
          setFeedback(t("game.feedback.correct"));

          if (newMatchedCount === totalPairs) {
            handleGameComplete(nextAttempts, mistakes);
          }
        }, 500);
      } else {
        // No match - gentle feedback and difficulty-based penalty
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        const penalty = MEMORY_MATCH_CONFIG[difficulty].mistakePenalty;

        setTimeout(() => {
          cardA.isFlipped = false;
          cardB.isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
          setScore((prev) => Math.max(40, prev - penalty));
        }, 1100);
      }
    }
  };

  const handleGameComplete = async (finalAttempts: number, finalMistakes: number) => {
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Normalize final score to 50-100 percentage range for consistent cognitive tracking
    const finalScore = Math.min(100, Math.max(50, score));
    const accuracy = Math.max(10, Math.min(100, Math.round((totalPairs / Math.max(totalPairs, finalAttempts)) * 100)));

    const session: GameSession = {
      id: `gs-${Date.now()}`,
      patientId,
      gameId: "memory_match",
      domain: "Memory & Attention",
      score: finalScore,
      timeTaken,
      difficulty,
      result: "completed",
      date: new Date().toISOString(),
      accuracy,
      attempts: finalAttempts,
      mistakes: finalMistakes
    };

    setSyncStatus("saving");
    const backendResult = await submitGameResultToBackend(session);

    if (backendResult) {
      setSyncStatus("synced");
      setAdaptiveNote(backendResult.adaptiveExplanation);
      setRecommendedGame(backendResult.recommendedGame);
      setWeakestDomainInfo(backendResult.weakestDomain);
      if (backendResult.nextDifficulty) {
        setDifficulty(normalizeDifficulty(backendResult.nextDifficulty));
      }
      saveGameSession(session);
    } else {
      setSyncStatus("fallback");
      saveGameSession(session);
      const adapt = calculateNextDifficulty(difficulty, finalScore);
      setAdaptiveNote(adapt.explanation);
      if (adapt.action === "increased") {
        setDifficulty(normalizeDifficulty(adapt.nextDifficulty));
      }
      const localRecs = getDomainRecommendations(patientId);
      if (localRecs?.weakestDomain) {
        setRecommendedGame(localRecs.weakestDomain.recommendedGameId);
        setWeakestDomainInfo(localRecs.weakestDomain);
      }
    }
  };

  const currentTier = DIFFICULTY_TIERS[difficulty];
  const config = MEMORY_MATCH_CONFIG[difficulty];
  const instructionText = t("game.memoryMatch.instruction");

  // Pre-game difficulty selection screen
  if (!hasStarted) {
    return (
      <DifficultySelector
        gameId="memory_match"
        selectedDifficulty={difficulty}
        onSelectDifficulty={(d) => setDifficulty(d)}
        onStart={() => startNewGame(difficulty)}
        title={t("game.memoryMatch.title")}
        domain={t("games.domain.memoryAttention")}
        instruction={instructionText}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {t("common.domain")}: {t("games.domain.memoryAttention")}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${currentTier.badgeColorClass}`}>
              <span aria-hidden="true">{currentTier.badgeIcon}</span>
              <span>{currentTier.name[lang] || currentTier.name.en}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.memoryMatch.title")}
            <SpeakButton text={`${t("game.memoryMatch.title")}. ${instructionText}`} id="mm-title" size="sm" />
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">{instructionText}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title={t("common.sound")}
            aria-label={t("common.sound")}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => startNewGame(difficulty)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title={t("common.restart")}
            aria-label={t("common.restart")}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setHasStarted(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            title="Change Level"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">
              {lang === "bn" ? "মাত্রা পরিবর্তন" : lang === "hi" ? "कठिनाई बदलें" : "Change Level"}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("common.home")}</span>
          </button>
        </div>
      </div>

      {/* Memory Preview Countdown Banner */}
      {isPreviewing && (
        <div className="my-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-xs animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-900">
                {lang === "bn"
                  ? `কার্ডগুলির অবস্থান মনে রাখুন! আর ${previewRemaining} সেকেন্ড`
                  : lang === "hi"
                  ? `कार्ड के स्थान याद रखें! शेष ${previewRemaining} सेकंड`
                  : `Memorize card locations! Flipping face-down in ${previewRemaining}s`}
              </p>
              <div className="w-48 sm:w-64 bg-blue-200/60 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(previewRemaining / config.previewSeconds) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => endPreviewPhase()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{lang === "bn" ? "এখনই শুরু করুন" : lang === "hi" ? "अभी शुरू करें" : "Start Now"}</span>
          </button>
        </div>
      )}

      {/* Live Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4 p-3 bg-slate-50 rounded-xl text-center text-sm font-medium text-slate-700 border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 block">{t("common.time")}</span>
          <span className="text-base font-bold text-slate-800">{timeTaken}s</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">{t("common.score")}</span>
          <span className="text-base font-bold text-blue-600">{score}%</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">
            {lang === "bn" ? "ভুল প্রচেষ্টা" : lang === "hi" ? "गलतियां" : "Mistakes"}
          </span>
          <span className="text-base font-bold text-amber-600">{mistakes}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">{t("common.difficulty")}</span>
          <span className="text-base font-bold capitalize text-slate-800 flex items-center justify-center gap-1">
            <span>{currentTier.badgeIcon}</span>
            <span>{currentTier.name[lang] || currentTier.name.en}</span>
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">
            {t("game.memoryMatch.pairsFound", { matched: matchesFound, total: totalPairs })}
          </span>
          <span className="text-base font-bold text-emerald-600">
            {matchesFound} / {totalPairs}
          </span>
        </div>
      </div>

      {/* Correct Match Feedback banner */}
      {feedback && !isCompleted && (
        <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-center text-sm font-medium flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Cards Grid: Dynamic per difficulty level */}
      <div className={`grid gap-3 sm:gap-4 my-4 ${config.gridColsClass}`}>
        {cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleCardClick(index)}
              disabled={isRevealed || isCompleted || isPreviewing}
              className={`${config.cardHeightClass} rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all duration-200 cursor-pointer shadow-sm select-none border-2 ${
                card.isMatched
                  ? "bg-emerald-50 border-emerald-300 opacity-90 scale-95"
                  : isRevealed
                  ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-100"
                  : "bg-gradient-to-br from-indigo-700 to-blue-800 border-indigo-900 hover:brightness-105 active:scale-95"
              }`}
            >
              {isRevealed ? (
                <>
                  <span className={`${difficulty === "pro" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} mb-1`}>
                    {card.item.symbol}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1 px-1">
                    {card.item.name[lang] || card.item.name.en}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] sm:text-xs font-bold tracking-wider text-blue-200 uppercase">RECALLED</span>
                  <span className="text-xl sm:text-2xl mt-0.5 text-blue-300 opacity-70">✦</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Game Completed Result Modal */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center animate-fade-in space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 bg-white shadow-xs">
              <span>{currentTier.badgeIcon}</span>
              <span>{currentTier.name[lang] || currentTier.name.en} Level</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
            <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
            {adaptiveNote && <p className="text-xs text-blue-700 mt-2 font-medium">{adaptiveNote}</p>}
          </div>

          {/* Performance Summary Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto p-3 bg-white rounded-xl border border-blue-200 text-center">
            <div>
              <span className="text-xs text-slate-500 block">Difficulty</span>
              <span className="text-sm font-bold text-slate-800">{currentTier.name[lang] || currentTier.name.en}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Accuracy</span>
              <span className="text-sm font-bold text-blue-600">
                {Math.max(10, Math.min(100, Math.round((totalPairs / Math.max(totalPairs, attempts)) * 100)))}%
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Mistakes</span>
              <span className="text-sm font-bold text-slate-700">{mistakes}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Time Taken</span>
              <span className="text-sm font-bold text-slate-700">{timeTaken}s</span>
            </div>
          </div>

          {/* Recommended Next Follow-up Exercise */}
          {weakestDomainInfo && (
            <div className="bg-white p-4 rounded-xl border border-blue-200 text-left max-w-md mx-auto shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                Suggested Follow-up Practice
              </span>
              <p className="text-xs text-slate-600 mb-2">
                Personalized practice based on your cognitive domain engagement:
              </p>
              <div className="flex items-center justify-between bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Focus: {weakestDomainInfo.domain}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Running Average: {weakestDomainInfo.runningAvg}% • {weakestDomainInfo.statusLabel}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-md capitalize">
                  {weakestDomainInfo.recommendedGameId.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          )}

          {/* Backend Sync / Storage Status Indicator */}
          <div className="inline-flex items-center justify-center">
            {syncStatus === "synced" && (
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Saved & analyzed by RECALLED backend
              </span>
            )}
            {syncStatus === "fallback" && (
              <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Saved locally (Backend offline fallback)
              </span>
            )}
            {syncStatus === "saving" && (
              <span className="text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                Saving session...
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startNewGame(difficulty)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold shadow-sm cursor-pointer transition-colors"
            >
              {t("game.feedback.playAgain")}
            </button>
            <button
              type="button"
              onClick={() => setHasStarted(false)}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors"
            >
              {lang === "bn" ? "মাত্রা পরিবর্তন" : lang === "hi" ? "कठिनाई बदलें" : "Change Level"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors"
            >
              {t("game.feedback.backToGames")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
