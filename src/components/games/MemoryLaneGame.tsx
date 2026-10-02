import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MEMORY_LANE_QUESTIONS, MemoryLaneQuestion } from "../../data/questions/memoryLaneQuestions";
import { DifficultyLevel, GameSession } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";

interface MemoryLaneGameProps {
  patientId: string;
  onClose: () => void;
}

export const MemoryLaneGame: React.FC<MemoryLaneGameProps> = ({ patientId, onClose }) => {
  const { t, language } = useLanguage();
  const { speak } = useSpeech();

  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [questions, setQuestions] = useState<MemoryLaneQuestion[]>([]);
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
    // Select questions
    const shuffled = [...MEMORY_LANE_QUESTIONS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setQuestions(shuffled.slice(0, 4));
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
    const correctAnsText =
      currentQ.options[language]?.[currentQ.correctIndex] || currentQ.options.en[currentQ.correctIndex];

    if (isCorrect) {
      const fb = t("game.feedback.correct");
      setFeedback(fb);
      if (soundEnabled) speak(fb, "ml-correct");
    } else {
      const fb = t("game.feedback.incorrect", { answer: correctAnsText });
      setFeedback(fb);
      setScore((prev) => Math.max(40, prev - 15));
      if (soundEnabled) speak(fb, "ml-incorrect");
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
      gameId: "memory_lane",
      domain: "Recall",
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

  const instructionText = t("game.memoryLane.instruction");

  if (!currentQ && !isCompleted) return null;

  const currentQuestionText = currentQ ? currentQ.question[language] || currentQ.question.en : "";
  const currentOptions = currentQ ? currentQ.options[language] || currentQ.options.en : [];

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 mb-1">
            {t("common.domain")}: {t("games.domain.recall")}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.memoryLane.title")}
            <SpeakButton text={`${t("game.memoryLane.title")}. ${instructionText}`} id="ml-title" size="sm" />
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

      {/* Feedback Banner */}
      {feedback && (
        <div className="my-3 p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-center text-sm font-medium flex items-center justify-center gap-2">
          <span>{feedback}</span>
        </div>
      )}

      {/* SPEC LAYOUT ORDER:
          1 Question → 2 Large image/media → 3 Era/regional context → 4 Answer options → 5 Status
      */}
      {!isCompleted && currentQ && (
        <div className="space-y-4 my-3">
          {/* 1. Question (FIRST) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
              {currentQuestionText}
            </h3>
            <SpeakButton text={currentQuestionText} id={`mlq-${currentIndex}`} size="md" />
          </div>

          {/* 2. Large Image/Media */}
          {currentQ.image && (
            <div className="w-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 p-2 max-h-[300px]">
              <img
                src={currentQ.image}
                alt={currentQ.category}
                className="max-h-[260px] w-auto max-w-full object-contain rounded-xl shadow-sm"
              />
              {currentQ.imageMeta && (
                <span className="text-[11px] text-slate-400 mt-1">
                  Source: {currentQ.imageMeta.source} • {currentQ.imageMeta.license}
                </span>
              )}
            </div>
          )}

          {/* 3. Era/Regional Context */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
              {currentQ.category}
            </span>
            <span>{t("game.memoryLane.era", { era: currentQ.era })}</span>
            {currentQ.region && <span>• Region: {currentQ.region}</span>}
          </div>

          {/* 4. Answer Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {currentOptions.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-800";
              if (isAnswerChecked) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-200";
                } else if (isSelected) {
                  btnStyle = "bg-amber-50 border-amber-300 text-amber-800";
                }
              }

              return (
                <button
                  key={`ml-opt-${idx}`}
                  type="button"
                  disabled={isAnswerChecked}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl text-left border-2 transition-all cursor-pointer shadow-sm flex items-center gap-3 disabled:cursor-not-allowed ${btnStyle}`}
                >
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                    {letter}
                  </span>
                  <span className="text-base font-medium">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* 5. Status Bar (At bottom of layout per spec) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 p-3 bg-slate-50 rounded-xl text-center text-sm font-medium text-slate-700 border border-slate-200">
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
        <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-600 text-white flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
          <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
          {adaptiveNote && <p className="text-xs text-amber-800 mt-2 font-medium">{adaptiveNote}</p>}

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
