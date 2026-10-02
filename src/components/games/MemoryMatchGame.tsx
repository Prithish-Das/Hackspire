import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MATCH_ITEMS, MatchCardItem } from "../../data/memoryMatchAssets";
import { DifficultyLevel, GameId, GameSession } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty, getDomainRecommendations } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";
import { submitGameResultToBackend } from "../../services/gameApi";

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
  const { speak } = useSpeech();

  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesFound, setMatchesFound] = useState(0);
  const [totalPairs, setTotalPairs] = useState(5);
  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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

  // Initialize game based on difficulty
  const startNewGame = (diff: DifficultyLevel = difficulty) => {
    // Beginner: 4 pairs (8 cards), Moderate: 5 pairs (10 cards), Advanced: 6 pairs (12 cards)
    const pairsCount = diff === "beginner" ? 4 : diff === "moderate" ? 5 : 6;
    setTotalPairs(pairsCount);

    const selectedPool = [...MATCH_ITEMS].slice(0, pairsCount);
    const deck: CardState[] = [];

    selectedPool.forEach((item, index) => {
      deck.push({ uid: `${item.id}-a-${index}`, item, isFlipped: false, isMatched: false });
      deck.push({ uid: `${item.id}-b-${index}`, item, isFlipped: false, isMatched: false });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchesFound(0);
    setScore(100);
    setTimeTaken(0);
    setIsCompleted(false);
    setFeedback(null);
    setAdaptiveNote(null);
    setSyncStatus("idle");
    setRecommendedGame(null);
    setWeakestDomainInfo(null);
  };

  useEffect(() => {
    startNewGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  // Silent timer
  useEffect(() => {
    if (isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  const handleCardClick = (index: number) => {
    if (isCompleted) return;
    if (flippedIndices.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (soundEnabled) {
      speak(newCards[index].item.name[language] || newCards[index].item.name.en, `card-${index}`);
    }

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const cardA = newCards[firstIdx];
      const cardB = newCards[secondIdx];

      if (cardA.item.id === cardB.item.id) {
        // Match!
        setTimeout(() => {
          cardA.isMatched = true;
          cardB.isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          const newMatchedCount = matchesFound + 1;
          setMatchesFound(newMatchedCount);
          setFeedback(t("game.feedback.correct"));

          if (newMatchedCount === totalPairs) {
            handleGameComplete();
          }
        }, 500);
      } else {
        // No match - gentle feedback
        setTimeout(() => {
          cardA.isFlipped = false;
          cardB.isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
          setScore((prev) => Math.max(40, prev - 5));
        }, 1100);
      }
    }
  };

  const handleGameComplete = async () => {
    setIsCompleted(true);
    const finalScore = Math.max(50, score);

    // Save session
    const session: GameSession = {
      id: `gs-${Date.now()}`,
      patientId,
      gameId: "memory_match",
      domain: "Memory & Attention",
      score: finalScore,
      timeTaken,
      difficulty,
      result: "completed",
      date: new Date().toISOString()
    };

    setSyncStatus("saving");
    const backendResult = await submitGameResultToBackend(session);

    if (backendResult) {
      setSyncStatus("synced");
      setAdaptiveNote(backendResult.adaptiveExplanation);
      setRecommendedGame(backendResult.recommendedGame);
      setWeakestDomainInfo(backendResult.weakestDomain);
      if (backendResult.nextDifficulty && difficulty !== backendResult.nextDifficulty) {
        setDifficulty(backendResult.nextDifficulty);
      }
      // Save locally to keep other views (dashboard, progress charts) in sync without duplicate counting
      saveGameSession(session);
    } else {
      setSyncStatus("fallback");
      saveGameSession(session);
      const adapt = calculateNextDifficulty(difficulty, finalScore);
      setAdaptiveNote(adapt.explanation);
      if (adapt.action === "increased" && difficulty !== adapt.nextDifficulty) {
        setDifficulty(adapt.nextDifficulty);
      }
      const localRecs = getDomainRecommendations(patientId);
      if (localRecs?.weakestDomain) {
        setRecommendedGame(localRecs.weakestDomain.recommendedGameId);
        setWeakestDomainInfo(localRecs.weakestDomain);
      }
    }
  };

  const instructionText = t("game.memoryMatch.instruction");

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-1">
            {t("common.domain")}: {t("games.domain.memoryAttention")}
          </span>
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
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title={t("common.sound")}
            aria-label={t("common.sound")}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => startNewGame()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title={t("common.restart")}
            aria-label={t("common.restart")}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.home")}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 p-3 bg-slate-50 rounded-xl text-center text-sm font-medium text-slate-700 border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 block">{t("common.time")}</span>
          <span className="text-base font-bold text-slate-800">{timeTaken}s</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">{t("common.score")}</span>
          <span className="text-base font-bold text-blue-600">{score}%</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">{t("common.difficulty")}</span>
          <span className="text-base font-semibold capitalize text-indigo-700">{difficulty}</span>
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

      {/* Feedback banner */}
      {feedback && !isCompleted && (
        <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-center text-sm font-medium flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Cards Grid: 10 large cards, responsive layout */}
      <div
        className={`grid gap-3 sm:gap-4 my-4 ${
          totalPairs <= 4
            ? "grid-cols-2 sm:grid-cols-4"
            : totalPairs === 5
            ? "grid-cols-2 sm:grid-cols-5"
            : "grid-cols-3 sm:grid-cols-6"
        }`}
      >
        {cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleCardClick(index)}
              disabled={isRevealed || isCompleted}
              className={`h-28 sm:h-36 rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all duration-200 cursor-pointer shadow-sm select-none border-2 ${
                card.isMatched
                  ? "bg-emerald-50 border-emerald-300 opacity-90 scale-95"
                  : isRevealed
                  ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-100"
                  : "bg-gradient-to-br from-indigo-700 to-blue-800 border-indigo-900 hover:brightness-105 active:scale-95"
              }`}
            >
              {isRevealed ? (
                <>
                  <span className="text-3xl sm:text-4xl mb-1">{card.item.symbol}</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-1">
                    {card.item.name[language] || card.item.name.en}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <span className="text-xs font-bold tracking-wider text-blue-200 uppercase">RECALLED</span>
                  <span className="text-2xl mt-1 text-blue-300 opacity-70">✦</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Game Completed Modal */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center animate-fade-in space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
            <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
            {adaptiveNote && <p className="text-xs text-blue-700 mt-2 font-medium">{adaptiveNote}</p>}
          </div>

          {/* Recommended Next Follow-up Exercise Card */}
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

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startNewGame()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
            >
              {t("game.feedback.playAgain")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              {t("game.feedback.backToGames")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
