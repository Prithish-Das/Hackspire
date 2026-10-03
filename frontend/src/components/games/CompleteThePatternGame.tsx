import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2, Sliders, Clock } from "lucide-react";
import { COMPLETE_PATTERN_QUESTIONS, CompletePatternQuestion } from "../../data/questions/patternQuestions";
import { DifficultyLevel, GameId, GameSession, Language } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty, getDomainRecommendations } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";
import { submitGameResultToBackend } from "../../services/gameApi";
import { DifficultySelector } from "./DifficultySelector";
import {
  COMPLETE_PATTERN_CONFIG,
  DIFFICULTY_TIERS,
  normalizeDifficulty,
  NormalizedDifficulty
} from "../../data/difficultyConfig";

interface CompleteThePatternGameProps {
  patientId: string;
  onClose: () => void;
}

export const CompleteThePatternGame: React.FC<CompleteThePatternGameProps> = ({
  patientId,
  onClose
}) => {
  const { t, language } = useLanguage();
  const lang = (language || "en") as Language;
  const { speak } = useSpeech();

  // Difficulty & Pre-game state
  const [hasStarted, setHasStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<NormalizedDifficulty>("beginner");

  // Gameplay state
  const [questions, setQuestions] = useState<CompletePatternQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Per-puzzle timer state
  const [puzzleSecondsLeft, setPuzzleSecondsLeft] = useState(30);
  const puzzleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const overallTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startNewGame = (diff: NormalizedDifficulty = difficulty) => {
    if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);

    const config = COMPLETE_PATTERN_CONFIG[diff];
    const puzzleCount = config.puzzleCount;

    // Filter questions by difficulty (support pro & advanced)
    const matching = COMPLETE_PATTERN_QUESTIONS.filter((q) => {
      const qDiff = normalizeDifficulty(q.difficulty as DifficultyLevel);
      return qDiff === diff;
    });

    const pool = matching.length > 0 ? matching : COMPLETE_PATTERN_QUESTIONS;

    // Shuffle questions pool
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedQuestions = shuffled.slice(0, puzzleCount);
    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setCorrectCount(0);
    setMistakes(0);
    setScore(100);
    setTimeTaken(0);
    setIsCompleted(false);
    setFeedback(null);
    setAdaptiveNote(null);
    setSyncStatus("idle");
    setRecommendedGame(null);
    setWeakestDomainInfo(null);
    setHasStarted(true);

    startPuzzleTimer(config.timeLimitSeconds, selectedQuestions, 0);
  };

  const startPuzzleTimer = (
    timeLimit: number,
    questionList: CompletePatternQuestion[],
    qIndex: number
  ) => {
    if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);

    setPuzzleSecondsLeft(timeLimit);
    let remaining = timeLimit;

    puzzleTimerRef.current = setInterval(() => {
      remaining -= 1;
      setPuzzleSecondsLeft(remaining);

      if (remaining <= 0) {
        if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);
        handlePuzzleTimeout(questionList, qIndex);
      }
    }, 1000);
  };

  const handlePuzzleTimeout = (questionList: CompletePatternQuestion[], qIndex: number) => {
    setIsAnswerChecked(true);
    setMistakes((prev) => prev + 1);
    setScore((prev) => Math.max(40, prev - (difficulty === "pro" ? 12 : 10)));

    const current = questionList[qIndex];
    if (current) {
      const correctItem = current.options[current.correctIndex];
      const correctName = correctItem.colorName[lang] || correctItem.colorName.en;
      const timeoutMsg =
        lang === "bn"
          ? `সময় শেষ! সঠিক উপাদান ছিল: ${correctName}`
          : lang === "hi"
          ? `समय समाप्त! सही उत्तर था: ${correctName}`
          : `Time is up! The correct element was ${correctName}.`;

      setFeedback(timeoutMsg);
      if (soundEnabled) speak(timeoutMsg, "cp-timeout");

      // Auto-advance after gentle pause
      setTimeout(() => {
        advanceToNextQuestion(qIndex + 1, questionList);
      }, 2400);
    }
  };

  // Overall game timer
  useEffect(() => {
    if (!hasStarted || isCompleted) {
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
      return;
    }
    overallTimerRef.current = setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => {
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    };
  }, [hasStarted, isCompleted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
      if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);
    };
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerChecked || isCompleted || !currentQ) return;
    if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);

    setSelectedOption(index);
    setIsAnswerChecked(true);

    const isCorrect = index === currentQ.correctIndex;
    const correctItem = currentQ.options[currentQ.correctIndex];
    const correctName = correctItem.colorName[lang] || correctItem.colorName.en;

    let nextCorrect = correctCount;
    let nextMistakes = mistakes;

    if (isCorrect) {
      nextCorrect += 1;
      setCorrectCount(nextCorrect);
      const fb = t("game.feedback.correct");
      setFeedback(fb);
      if (soundEnabled) speak(fb, "cp-correct");
    } else {
      nextMistakes += 1;
      setMistakes(nextMistakes);
      const penalty = difficulty === "pro" ? 10 : difficulty === "moderate" ? 8 : 6;
      setScore((prev) => Math.max(40, prev - penalty));
      const fb = t("game.feedback.incorrect", { answer: correctName });
      setFeedback(fb);
      if (soundEnabled) speak(fb, "cp-incorrect");
    }

    // Advance to next question after reviewing feedback and explanation
    setTimeout(() => {
      advanceToNextQuestion(currentIndex + 1, questions, nextCorrect, nextMistakes);
    }, 2200);
  };

  const advanceToNextQuestion = (
    nextIdx: number,
    questionList: CompletePatternQuestion[],
    currentCorrect = correctCount,
    currentMistakes = mistakes
  ) => {
    if (nextIdx < questionList.length) {
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setFeedback(null);
      startPuzzleTimer(COMPLETE_PATTERN_CONFIG[difficulty].timeLimitSeconds, questionList, nextIdx);
    } else {
      handleGameComplete(currentCorrect, currentMistakes);
    }
  };

  const handleGameComplete = async (finalCorrect: number, finalMistakes: number) => {
    setIsCompleted(true);
    if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    if (puzzleTimerRef.current) clearInterval(puzzleTimerRef.current);

    const totalQuestions = questions.length || 1;
    const accuracy = Math.max(10, Math.min(100, Math.round((finalCorrect / totalQuestions) * 100)));
    const finalScore = Math.max(50, Math.min(100, score));

    const session: GameSession = {
      id: `gs-${Date.now()}`,
      patientId,
      gameId: "complete_the_pattern",
      domain: "Pattern Recognition",
      score: finalScore,
      timeTaken,
      difficulty,
      result: "completed",
      date: new Date().toISOString(),
      accuracy,
      attempts: totalQuestions,
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
  const config = COMPLETE_PATTERN_CONFIG[difficulty];
  const instructionText = t("game.completePattern.instruction");

  // Pre-game difficulty selection
  if (!hasStarted) {
    return (
      <DifficultySelector
        gameId="complete_the_pattern"
        selectedDifficulty={difficulty}
        onSelectDifficulty={(d) => setDifficulty(d)}
        onStart={() => startNewGame(difficulty)}
        title={t("game.completePattern.title")}
        domain={t("games.domain.patternRecognition")}
        instruction={instructionText}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {t("common.domain")}: {t("games.domain.patternRecognition")}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${currentTier.badgeColorClass}`}>
              <span aria-hidden="true">{currentTier.badgeIcon}</span>
              <span>{currentTier.name[lang] || currentTier.name.en}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.completePattern.title")}
            <SpeakButton text={`${t("game.completePattern.title")}. ${instructionText}`} id="cp-title" size="sm" />
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
            {soundEnabled ? <Volume2 className="w-5 h-5 text-teal-600" /> : <VolumeX className="w-5 h-5" />}
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
          <span className="text-base font-bold text-teal-700">{score}%</span>
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
          <span className="text-xs text-slate-500 block">Puzzle</span>
          <span className="text-base font-bold text-slate-800">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Per-Puzzle Countdown Bar */}
      {!isCompleted && currentQ && (
        <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock className={`w-4 h-4 ${puzzleSecondsLeft <= 5 ? "text-rose-600 animate-pulse" : "text-slate-500"}`} />
            <span>
              {lang === "bn" ? "সময় বাকি:" : lang === "hi" ? "शेष समय:" : "Time Left:"}{" "}
              <strong className={puzzleSecondsLeft <= 5 ? "text-rose-600 font-bold" : "text-slate-800"}>
                {puzzleSecondsLeft}s
              </strong>
            </span>
          </div>

          <div className="w-36 sm:w-48 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                puzzleSecondsLeft <= 5 ? "bg-rose-500" : "bg-teal-600"
              }`}
              style={{ width: `${(puzzleSecondsLeft / config.timeLimitSeconds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Active Puzzle Screen */}
      {!isCompleted && currentQ && (
        <div className="my-5 space-y-6">
          {/* Pattern Track with "?" Placeholder */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">
              Rule: {currentQ.ruleType}
            </span>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {currentQ.sequence.map((item, idx) => {
                const isMissing = item === null;
                return (
                  <div
                    key={`pat-item-${idx}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 transition-all ${
                      isMissing
                        ? "border-amber-500 border-dashed bg-amber-50 text-amber-700 font-bold text-3xl shadow-sm animate-pulse"
                        : "border-slate-200 bg-white shadow-sm"
                    }`}
                  >
                    {isMissing ? (
                      selectedOption !== null && isAnswerChecked ? (
                        <span className="text-3xl select-none">
                          {currentQ.options[selectedOption].symbol}
                        </span>
                      ) : (
                        "?"
                      )
                    ) : (
                      <span className="text-3xl sm:text-4xl select-none">{item.symbol}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback & Explanation Card */}
          {feedback && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-center animate-fade-in space-y-1">
              <p className="font-bold text-sm sm:text-base">{feedback}</p>
              {currentQ.explanation && (
                <p className="text-xs text-slate-600 font-medium">
                  {currentQ.explanation[lang] || currentQ.explanation.en}
                </p>
              )}
            </div>
          )}

          {/* 4 Large Answer Choices */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 text-center">
              {lang === "bn"
                ? "প্যাটার্নটি সম্পন্ন করার জন্য সঠিক বিকল্পটি বেছে নিন:"
                : lang === "hi"
                ? "पैटर्न पूरा करने के लिए सही विकल्प चुनें:"
                : "Choose the element that completes the pattern:"}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let cardStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-800";
                if (isAnswerChecked) {
                  if (isCorrect) {
                    cardStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-200";
                  } else if (isSelected) {
                    cardStyle = "bg-amber-50 border-amber-300 text-amber-800";
                  }
                }

                return (
                  <button
                    key={`opt-choice-${idx}`}
                    type="button"
                    disabled={isAnswerChecked}
                    onClick={() => handleSelectOption(idx)}
                    className={`h-28 rounded-2xl flex flex-col items-center justify-center p-3 border-2 transition-all cursor-pointer shadow-xs active:scale-95 disabled:cursor-not-allowed ${cardStyle}`}
                  >
                    <span className="text-3xl sm:text-4xl mb-1 select-none" aria-hidden="true">
                      {option.symbol}
                    </span>
                    <span className="text-xs font-semibold text-center line-clamp-1">
                      {option.colorName[lang] || option.colorName.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Game Completed Result Modal */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-teal-50 border border-teal-200 rounded-2xl text-center animate-fade-in space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 bg-white shadow-xs">
              <span>{currentTier.badgeIcon}</span>
              <span>{currentTier.name[lang] || currentTier.name.en} Level</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
            <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
            {adaptiveNote && <p className="text-xs text-teal-800 mt-2 font-medium">{adaptiveNote}</p>}
          </div>

          {/* Performance Summary Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto p-3 bg-white rounded-xl border border-teal-200 text-center">
            <div>
              <span className="text-xs text-slate-500 block">Difficulty</span>
              <span className="text-sm font-bold text-slate-800">{currentTier.name[lang] || currentTier.name.en}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Accuracy</span>
              <span className="text-sm font-bold text-teal-700">
                {Math.max(10, Math.min(100, Math.round((correctCount / Math.max(1, questions.length)) * 100)))}%
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
            <div className="bg-white p-4 rounded-xl border border-teal-200 text-left max-w-md mx-auto shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block mb-1">
                Suggested Follow-up Practice
              </span>
              <p className="text-xs text-slate-600 mb-2">
                Personalized practice based on your cognitive domain engagement:
              </p>
              <div className="flex items-center justify-between bg-teal-50/70 p-2.5 rounded-lg border border-teal-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Focus: {weakestDomainInfo.domain}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Running Average: {weakestDomainInfo.runningAvg}% • {weakestDomainInfo.statusLabel}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-teal-600 text-white text-[11px] font-bold rounded-md capitalize">
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
              <span className="text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                Saving session...
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startNewGame(difficulty)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold shadow-sm cursor-pointer transition-colors"
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
