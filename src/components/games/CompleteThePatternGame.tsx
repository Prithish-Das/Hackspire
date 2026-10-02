import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { COMPLETE_PATTERN_QUESTIONS, CompletePatternQuestion, PatternItem } from "../../data/questions/patternQuestions";
import { DifficultyLevel, GameSession } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";

interface CompleteThePatternGameProps {
  patientId: string;
  onClose: () => void;
}

export const CompleteThePatternGame: React.FC<CompleteThePatternGameProps> = ({
  patientId,
  onClose
}) => {
  const { t, language } = useLanguage();
  const { speak } = useSpeech();

  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [questions, setQuestions] = useState<CompletePatternQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adaptiveNote, setAdaptiveNote] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startNewGame = (diff: DifficultyLevel = difficulty) => {
    // Filter questions by difficulty or fallback to all
    const matching = COMPLETE_PATTERN_QUESTIONS.filter((q) => q.difficulty === diff);
    const pool = matching.length > 0 ? matching : COMPLETE_PATTERN_QUESTIONS;

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setQuestions(shuffled.slice(0, 3));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(100);
    setTimeTaken(0);
    setIsCompleted(false);
    setFeedback(null);
    setAdaptiveNote(null);
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

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerChecked || isCompleted || !currentQ) return;

    setSelectedOption(index);
    setIsAnswerChecked(true);

    const isCorrect = index === currentQ.correctIndex;
    const correctItem = currentQ.options[currentQ.correctIndex];
    const correctName = correctItem.colorName[language] || correctItem.colorName.en;

    if (isCorrect) {
      const fb = t("game.feedback.correct");
      setFeedback(fb);
      if (soundEnabled) speak(fb, "cp-correct");
    } else {
      const fb = t("game.feedback.incorrect", { answer: correctName });
      setFeedback(fb);
      setScore((prev) => Math.max(40, prev - 15));
      if (soundEnabled) speak(fb, "cp-incorrect");
    }

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswerChecked(false);
        setFeedback(null);
      } else {
        handleGameComplete();
      }
    }, 2200);
  };

  const handleGameComplete = () => {
    setIsCompleted(true);
    const finalScore = score;

    const session: GameSession = {
      id: `gs-${Date.now()}`,
      patientId,
      gameId: "complete_the_pattern",
      domain: "Pattern Recognition",
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

  const instructionText = t("game.completePattern.instruction");

  if (!currentQ && !isCompleted) return null;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200 mb-1">
            {t("common.domain")}: {t("games.domain.patternRecognition")}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.completePattern.title")}
            <SpeakButton text={`${t("game.completePattern.title")}. ${instructionText}`} id="cp-title" size="sm" />
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">{instructionText}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title={t("common.sound")}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => startNewGame()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title={t("common.restart")}
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

      {/* SPEC LAYOUT:
          Pattern → missing element ("?") → large answer choices → feedback → status
      */}
      {!isCompleted && currentQ && (
        <div className="my-6 space-y-6">
          {/* 1. The Pattern Track with Missing Element "?" */}
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
                        <span className="text-3xl">
                          {currentQ.options[selectedOption].symbol}
                        </span>
                      ) : (
                        "?"
                      )
                    ) : (
                      <span className="text-3xl sm:text-4xl">{item.symbol}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Large Answer Choices */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 text-center">
              Choose the element that completes the pattern:
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
                    className={`h-24 sm:h-28 rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed ${cardStyle}`}
                  >
                    <span className="text-3xl sm:text-4xl mb-1">{option.symbol}</span>
                    <span className="text-xs font-semibold text-slate-700 text-center line-clamp-1">
                      {option.colorName[language] || option.colorName.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Feedback Banner */}
          {feedback && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-center text-sm font-medium flex items-center justify-center gap-2">
              <span>{feedback}</span>
            </div>
          )}

          {/* 4. Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl text-center text-sm font-medium text-slate-700 border border-slate-200">
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
              <span className="text-base font-bold text-emerald-600">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Completion Dialog */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-teal-50 border border-teal-200 rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-teal-600 text-white flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
          <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
          {adaptiveNote && <p className="text-xs text-teal-800 mt-2 font-medium">{adaptiveNote}</p>}

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
