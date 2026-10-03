import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2, Sliders } from "lucide-react";
import { DifficultyLevel, GameId, GameSession, Language } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty, getDomainRecommendations } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";
import { submitGameResultToBackend } from "../../services/gameApi";
import { DifficultySelector } from "./DifficultySelector";
import {
  PATTERN_RHYTHM_CONFIG,
  ALL_RHYTHM_TILES,
  DIFFICULTY_TIERS,
  RhythmPadItem,
  normalizeDifficulty,
  NormalizedDifficulty
} from "../../data/difficultyConfig";

const playTileFrequency = (freq: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.32);
    setTimeout(() => {
      ctx.close();
    }, 380);
  } catch {
    // Graceful fallback if audio context is blocked
  }
};

interface PatternRhythmGameProps {
  patientId: string;
  onClose: () => void;
}

export const PatternRhythmGame: React.FC<PatternRhythmGameProps> = ({ patientId, onClose }) => {
  const { t, language } = useLanguage();
  const lang = (language || "en") as Language;
  const { speak } = useSpeech();

  const speakRef = useRef(speak);
  speakRef.current = speak;
  const languageRef = useRef(lang);
  languageRef.current = lang;

  // Pre-game state
  const [hasStarted, setHasStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<NormalizedDifficulty>("beginner");

  // Gameplay state
  const [sequence, setSequence] = useState<RhythmPadItem[]>([]);
  const [playerInput, setPlayerInput] = useState<RhythmPadItem[]>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [playbackTrigger, setPlaybackTrigger] = useState(0);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number | null>(null);
  const [activePressedPadId, setActivePressedPadId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [round, setRound] = useState(1);
  const totalRounds = 2;
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const timerRef = useRef<number | null>(null);
  const playbackTimerRef = useRef<number | null>(null);

  const getPadsForDifficulty = (diff: NormalizedDifficulty): RhythmPadItem[] => {
    const config = PATTERN_RHYTHM_CONFIG[diff];
    return config.padIds.map((id) => ALL_RHYTHM_TILES[id]).filter(Boolean);
  };

  const generateSequence = (diff: NormalizedDifficulty, roundNum: number) => {
    const config = PATTERN_RHYTHM_CONFIG[diff];
    const availablePads = getPadsForDifficulty(diff);
    const seqLen = config.sequenceLength;

    const newSeq: RhythmPadItem[] = [];
    for (let i = 0; i < seqLen; i++) {
      const randomPad = availablePads[Math.floor(Math.random() * availablePads.length)];
      newSeq.push(randomPad);
    }

    setSequence(newSeq);
    setPlayerInput([]);
    setActivePlaybackIndex(null);
    setFeedback(null);
    setIsPlayingSequence(true);
    setPlaybackTrigger((k) => k + 1);
  };

  const startNewGame = (diff: NormalizedDifficulty = difficulty) => {
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setActivePlaybackIndex(null);
    setScore(100);
    setTimeTaken(0);
    setAttempts(0);
    setMistakes(0);
    setRound(1);
    setIsCompleted(false);
    setFeedback(null);
    setAdaptiveNote(null);
    setSyncStatus("idle");
    setRecommendedGame(null);
    setWeakestDomainInfo(null);
    setHasStarted(true);

    generateSequence(diff, 1);
  };

  // Timer
  useEffect(() => {
    if (!hasStarted || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = window.setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isCompleted]);

  // Clean playback of the sequence
  useEffect(() => {
    if (!isPlayingSequence || sequence.length === 0) return;

    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
    }

    const stepSpeed = PATTERN_RHYTHM_CONFIG[difficulty].stepSpeedMs;
    let currentIndex = 0;
    let isCancelled = false;

    const playNextStep = () => {
      if (isCancelled) return;

      if (currentIndex < sequence.length) {
        setActivePlaybackIndex(currentIndex);
        const pad = sequence[currentIndex];

        if (soundEnabledRef.current) {
          playTileFrequency(pad.frequency);
          if (stepSpeed >= 800) {
            try {
              speakRef.current(pad.name[languageRef.current] || pad.name.en, `rhythm-${currentIndex}`);
            } catch {
              // ignore
            }
          }
        }

        currentIndex++;
        playbackTimerRef.current = window.setTimeout(playNextStep, stepSpeed);
      } else {
        playbackTimerRef.current = window.setTimeout(() => {
          if (!isCancelled) {
            setActivePlaybackIndex(null);
            setIsPlayingSequence(false);
          }
        }, Math.min(400, stepSpeed / 2));
      }
    };

    // Slight initial pause before starting playback so the user sees sequence ready
    playbackTimerRef.current = window.setTimeout(playNextStep, 500);

    return () => {
      isCancelled = true;
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, [isPlayingSequence, sequence, playbackTrigger, difficulty]);

  const handleTilePress = (pad: RhythmPadItem) => {
    if (isPlayingSequence || isCompleted || !hasStarted) return;
    if (sequence.length === 0) return;

    const nextIndex = playerInput.length;
    if (nextIndex >= sequence.length) return;

    const expected = sequence[nextIndex];
    if (!expected) return;

    // Visual press ripple
    setActivePressedPadId(pad.id);
    setTimeout(() => setActivePressedPadId(null), 250);

    const newInput = [...playerInput, pad];
    setPlayerInput(newInput);
    setAttempts((prev) => prev + 1);

    if (soundEnabledRef.current) {
      playTileFrequency(pad.frequency);
    }

    if (pad.id === expected.id) {
      // Correct step
      if (newInput.length === sequence.length) {
        // Round completed successfully!
        if (round >= totalRounds) {
          handleGameComplete(true);
        } else {
          setFeedback(t("game.feedback.correct"));
          setTimeout(() => {
            setRound((r) => r + 1);
            generateSequence(difficulty, round + 1);
          }, 1100);
        }
      }
    } else {
      // Gentle incorrect feedback (never punishing)
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      const penalty = difficulty === "pro" ? 15 : difficulty === "moderate" ? 10 : 8;
      setScore((prev) => Math.max(40, prev - penalty));

      const expectedName = expected.name[languageRef.current] || expected.name.en;
      setFeedback(t("game.feedback.incorrect", { answer: expectedName }));

      // Replay sequence for supportive guidance
      setTimeout(() => {
        setPlayerInput([]);
        setFeedback(null);
        setIsPlayingSequence(true);
        setPlaybackTrigger((k) => k + 1);
      }, 1600);
    }
  };

  const handleGameComplete = async (won: boolean) => {
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScore = won ? Math.max(50, score) : 50;
    const totalExpectedTaps = sequence.length * totalRounds;
    const accuracy = Math.max(
      15,
      Math.min(100, Math.round((totalExpectedTaps / (totalExpectedTaps + mistakes)) * 100))
    );

    const session: GameSession = {
      id: `gs-${Date.now()}`,
      patientId,
      gameId: "pattern_rhythm",
      domain: "Pattern Recognition & Attention",
      score: finalScore,
      timeTaken,
      difficulty,
      result: "completed",
      date: new Date().toISOString(),
      accuracy,
      attempts: totalExpectedTaps + mistakes,
      mistakes
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
  const config = PATTERN_RHYTHM_CONFIG[difficulty];
  const activePads = getPadsForDifficulty(difficulty);
  const instructionText = t("game.patternRhythm.instruction");

  // Pre-game difficulty selection
  if (!hasStarted) {
    return (
      <DifficultySelector
        gameId="pattern_rhythm"
        selectedDifficulty={difficulty}
        onSelectDifficulty={(d) => setDifficulty(d)}
        onStart={() => startNewGame(difficulty)}
        title={t("game.patternRhythm.title")}
        domain={t("games.domain.patternRhythm")}
        instruction={instructionText}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {t("common.domain")}: {t("games.domain.patternRhythm")}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${currentTier.badgeColorClass}`}>
              <span aria-hidden="true">{currentTier.badgeIcon}</span>
              <span>{currentTier.name[lang] || currentTier.name.en}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.patternRhythm.title")}
            <SpeakButton text={`${t("game.patternRhythm.title")}. ${instructionText}`} id="pr-title" size="sm" />
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
            {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5" />}
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

      {/* Live Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4 p-3 bg-slate-50 rounded-xl text-center text-sm font-medium text-slate-700 border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 block">{t("common.time")}</span>
          <span className="text-base font-bold text-slate-800">{timeTaken}s</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">{t("common.score")}</span>
          <span className="text-base font-bold text-indigo-600">{score}%</span>
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
          <span className="text-xs text-slate-500 block">Round</span>
          <span className="text-base font-bold text-slate-800">
            {round} / {totalRounds}
          </span>
        </div>
      </div>

      {/* Instruction & Status Ribbon */}
      <div className="my-4 text-center">
        {isPlayingSequence ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-semibold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>{t("game.patternRhythm.watch")}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t("game.patternRhythm.yourTurn")}</span>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && !isCompleted && (
        <div className="mb-4 p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-center text-sm font-medium">
          {feedback}
        </div>
      )}

      {/* Sequence Step Tracker / Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {sequence.map((step, idx) => {
          const isCurrentPlayback = activePlaybackIndex === idx;
          const isPlayerFilled = playerInput.length > idx;

          return (
            <div
              key={`seq-ind-${idx}`}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-200 border-2 ${
                isCurrentPlayback
                  ? "scale-110 shadow-md ring-4 ring-indigo-300 border-indigo-600"
                  : isPlayerFilled
                  ? "border-emerald-500 bg-emerald-50 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
              style={{
                backgroundColor: isCurrentPlayback ? step.bgLight : isPlayerFilled ? undefined : undefined,
                borderColor: isCurrentPlayback ? step.color : undefined
              }}
            >
              {isCurrentPlayback ? (
                <span className="text-lg select-none">{step.symbol}</span>
              ) : isPlayerFilled ? (
                <span className="text-sm select-none">{playerInput[idx]?.symbol || "✓"}</span>
              ) : (
                <span className="text-xs font-semibold text-slate-400">{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Pads / Tiles Grid: 4 for Beginner, 6 for Moderate, 8 for Pro */}
      <div className={`grid gap-3 sm:gap-4 my-6 ${config.gridColsClass}`}>
        {activePads.map((pad) => {
          const isHighlighted =
            (activePlaybackIndex !== null && sequence[activePlaybackIndex]?.id === pad.id) ||
            activePressedPadId === pad.id;

          return (
            <button
              key={pad.id}
              type="button"
              onClick={() => handleTilePress(pad)}
              disabled={isPlayingSequence || isCompleted}
              className={`h-24 sm:h-28 rounded-2xl flex flex-col items-center justify-center p-3 text-center transition-all duration-150 cursor-pointer shadow-sm select-none border-3 active:scale-95 disabled:cursor-not-allowed ${
                isHighlighted
                  ? "scale-105 shadow-lg ring-4 ring-indigo-300 brightness-110"
                  : "hover:brightness-105"
              }`}
              style={{
                backgroundColor: isHighlighted ? pad.activeBg : pad.color,
                borderColor: isHighlighted ? "#ffffff" : "rgba(0,0,0,0.15)"
              }}
            >
              <span className="text-2xl sm:text-3xl mb-1 drop-shadow-sm select-none" aria-hidden="true">
                {pad.symbol}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide drop-shadow-md">
                {pad.name[lang] || pad.name.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* Game Completed Result Modal */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-indigo-50 border border-indigo-200 rounded-2xl text-center animate-fade-in space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 bg-white shadow-xs">
              <span>{currentTier.badgeIcon}</span>
              <span>{currentTier.name[lang] || currentTier.name.en} Level</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
            <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
            {adaptiveNote && <p className="text-xs text-indigo-700 mt-2 font-medium">{adaptiveNote}</p>}
          </div>

          {/* Performance Summary Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto p-3 bg-white rounded-xl border border-indigo-200 text-center">
            <div>
              <span className="text-xs text-slate-500 block">Difficulty</span>
              <span className="text-sm font-bold text-slate-800">{currentTier.name[lang] || currentTier.name.en}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Accuracy</span>
              <span className="text-sm font-bold text-indigo-600">
                {Math.max(15, Math.min(100, Math.round(((sequence.length * totalRounds) / ((sequence.length * totalRounds) + mistakes)) * 100)))}%
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
            <div className="bg-white p-4 rounded-xl border border-indigo-200 text-left max-w-md mx-auto shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                Suggested Follow-up Practice
              </span>
              <p className="text-xs text-slate-600 mb-2">
                Personalized practice based on your cognitive domain engagement:
              </p>
              <div className="flex items-center justify-between bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Focus: {weakestDomainInfo.domain}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Running Average: {weakestDomainInfo.runningAvg}% • {weakestDomainInfo.statusLabel}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-md capitalize">
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
              <span className="text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                Saving session...
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startNewGame(difficulty)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold shadow-sm cursor-pointer transition-colors"
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
