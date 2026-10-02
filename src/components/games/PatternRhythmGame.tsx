import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2, HelpCircle } from "lucide-react";
import { DifficultyLevel, GameSession } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";

interface RhythmTile {
  id: string;
  name: { en: string; bn: string; hi: string };
  color: string;
  bgLight: string;
  symbol: string;
}

const BASE_TILES: RhythmTile[] = [
  {
    id: "blue",
    name: { en: "Blue", bn: "নীল", hi: "नीला" },
    color: "#2563eb",
    bgLight: "#dbeafe",
    symbol: "🔵"
  },
  {
    id: "yellow",
    name: { en: "Yellow", bn: "হলুদ", hi: "पीला" },
    color: "#ca8a04",
    bgLight: "#fef9c3",
    symbol: "🟡"
  },
  {
    id: "green",
    name: { en: "Green", bn: "সবুজ", hi: "हरा" },
    color: "#16a34a",
    bgLight: "#dcfce7",
    symbol: "🟢"
  },
  {
    id: "red",
    name: { en: "Red", bn: "লাল", hi: "लाल" },
    color: "#dc2626",
    bgLight: "#fee2e2",
    symbol: "🔴"
  },
  {
    id: "purple",
    name: { en: "Purple", bn: "বেগুনি", hi: "बैंगनी" },
    color: "#9333ea",
    bgLight: "#f3e8ff",
    symbol: "🟣"
  }
];

interface PatternRhythmGameProps {
  patientId: string;
  onClose: () => void;
}

export const PatternRhythmGame: React.FC<PatternRhythmGameProps> = ({ patientId, onClose }) => {
  const { t, language } = useLanguage();
  const { speak } = useSpeech();

  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [sequence, setSequence] = useState<RhythmTile[]>([]);
  const [playerInput, setPlayerInput] = useState<RhythmTile[]>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adaptiveNote, setAdaptiveNote] = useState<string | null>(null);
  const [round, setRound] = useState(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateSequence = (diff: DifficultyLevel, roundNum: number) => {
    // Beginner: 3-4 items, Moderate: 5 items, Advanced: 6 items
    const length = diff === "beginner" ? (roundNum === 1 ? 3 : 4) : diff === "moderate" ? 5 : 6;
    const newSeq: RhythmTile[] = [];

    for (let i = 0; i < length; i++) {
      const randomTile = BASE_TILES[Math.floor(Math.random() * BASE_TILES.length)];
      newSeq.push(randomTile);
    }

    setSequence(newSeq);
    setPlayerInput([]);
    setIsPlayingSequence(true);
    setActivePlaybackIndex(null);
    setFeedback(null);
  };

  const startNewGame = (diff: DifficultyLevel = difficulty) => {
    setScore(100);
    setTimeTaken(0);
    setRound(1);
    setIsCompleted(false);
    setFeedback(null);
    setAdaptiveNote(null);
    generateSequence(diff, 1);
  };

  useEffect(() => {
    startNewGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  // Timer
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

  // Play sequence animation
  useEffect(() => {
    if (!isPlayingSequence || sequence.length === 0) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < sequence.length) {
        setActivePlaybackIndex(index);
        const tile = sequence[index];
        if (soundEnabled) {
          speak(tile.name[language] || tile.name.en, `rhythm-${index}`);
        }
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setActivePlaybackIndex(null);
          setIsPlayingSequence(false);
        }, 500);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isPlayingSequence, sequence, soundEnabled, language, speak]);

  const handleTilePress = (tile: RhythmTile) => {
    if (isPlayingSequence || isCompleted) return;

    const nextIndex = playerInput.length;
    const expected = sequence[nextIndex];

    const newInput = [...playerInput, tile];
    setPlayerInput(newInput);

    if (tile.id === expected.id) {
      // Correct step
      if (soundEnabled) {
        speak(tile.name[language] || tile.name.en, `tile-${nextIndex}`);
      }

      if (newInput.length === sequence.length) {
        // Round completed successfully!
        if (round >= 2) {
          handleGameComplete(true);
        } else {
          setFeedback(t("game.feedback.correct"));
          setTimeout(() => {
            setRound(2);
            generateSequence(difficulty, 2);
          }, 1200);
        }
      }
    } else {
      // Gentle incorrect feedback (never punishing)
      const expectedName = expected.name[language] || expected.name.en;
      setFeedback(t("game.feedback.incorrect", { answer: expectedName }));
      setScore((prev) => Math.max(40, prev - 15));

      // Replay sequence for patient support
      setTimeout(() => {
        setPlayerInput([]);
        setFeedback(null);
        setIsPlayingSequence(true);
      }, 1800);
    }
  };

  const handleGameComplete = (won: boolean) => {
    setIsCompleted(true);
    const finalScore = won ? score : 50;

    const session: GameSession = {
      id: `gs-${Date.now()}`,
      patientId,
      gameId: "pattern_rhythm",
      domain: "Pattern Recognition & Attention",
      score: finalScore,
      timeTaken,
      difficulty,
      result: "completed",
      date: new Date().toISOString()
    };
    saveGameSession(session);

    const adapt = calculateNextDifficulty(difficulty, finalScore);
    setAdaptiveNote(adapt.explanation);
    if (adapt.action === "increased" && difficulty !== adapt.nextDifficulty) {
      setDifficulty(adapt.nextDifficulty);
    }
  };

  const instructionText = t("game.patternRhythm.instruction");

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
            {t("common.domain")}: {t("games.domain.patternRhythm")}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.patternRhythm.title")}
            <SpeakButton text={`${t("game.patternRhythm.title")}. ${instructionText}`} id="pr-title" size="sm" />
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">{instructionText}</p>
        </div>

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
            onClick={() => {
              setPlayerInput([]);
              setIsPlayingSequence(true);
            }}
            disabled={isPlayingSequence}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title={t("common.hint")}
            aria-label={t("common.hint")}
          >
            <HelpCircle className="w-5 h-5" />
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
          <span className="text-xs text-slate-500 block">{t("common.level")}</span>
          <span className="text-base font-bold text-emerald-600">Round {round} / 2</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-center text-sm font-medium flex items-center justify-center gap-2">
          <span>{feedback}</span>
        </div>
      )}

      {/* Sequence Track (Dominant element, fits without overflow) */}
      <div className="my-6 p-6 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center min-h-[160px] shadow-inner">
        <span className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-semibold">
          {isPlayingSequence ? t("game.patternRhythm.watch") : t("game.patternRhythm.yourTurn")}
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-full">
          {sequence.map((tile, idx) => {
            const isHighlighted = activePlaybackIndex === idx;
            const isEntered = idx < playerInput.length;
            const isCurrentPending = !isPlayingSequence && idx === playerInput.length;

            return (
              <div
                key={`seq-item-${idx}`}
                className={`w-14 h-14 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center transition-all duration-200 border-2 ${
                  isHighlighted
                    ? "scale-110 shadow-lg ring-4 ring-white"
                    : isEntered
                    ? "opacity-90 border-emerald-400 bg-slate-800"
                    : isCurrentPending
                    ? "border-amber-400 border-dashed animate-pulse bg-slate-800"
                    : "border-slate-700 bg-slate-800 opacity-60"
                }`}
                style={{
                  backgroundColor: isHighlighted ? tile.color : undefined,
                  borderColor: isHighlighted ? "#ffffff" : undefined
                }}
              >
                {isEntered ? (
                  <span className="text-2xl sm:text-3xl">{playerInput[idx].symbol}</span>
                ) : isHighlighted ? (
                  <span className="text-2xl sm:text-3xl text-white">{tile.symbol}</span>
                ) : (
                  <span className="text-sm font-bold text-slate-400">{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Tiles (Large touch targets) */}
      <div className="mt-6">
        <p className="text-xs sm:text-sm font-medium text-slate-500 text-center mb-3">
          {isPlayingSequence
            ? "Observing pattern..."
            : "Tap the colors below in the exact sequence you observed:"}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {BASE_TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              disabled={isPlayingSequence || isCompleted}
              onClick={() => handleTilePress(tile)}
              className="h-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center p-2 text-center border-2 border-slate-200 hover:border-slate-400 hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: tile.bgLight }}
            >
              <span className="text-2xl sm:text-3xl mb-1">{tile.symbol}</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {tile.name[language] || tile.name.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Completion Dialog */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
          <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
          {adaptiveNote && <p className="text-xs text-indigo-700 mt-2 font-medium">{adaptiveNote}</p>}

          <div className="flex flex-wrap justify-center gap-3 mt-5">
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
