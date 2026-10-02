import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle2, User } from "lucide-react";
import { DifficultyLevel, GameSession, MemoryAlbumItem } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { getMemoryAlbum, saveGameSession } from "../../utils/storage";
import { calculateNextDifficulty } from "../../utils/adaptive";
import { SpeakButton } from "../common/SpeakButton";

interface FamilyRecallGameProps {
  patientId: string;
  onClose: () => void;
}

interface QuestionItem {
  id: string;
  question: string;
  image: string;
  correctAnswer: string;
  options: string[];
  context: string;
}

export const FamilyRecallGame: React.FC<FamilyRecallGameProps> = ({ patientId, onClose }) => {
  const { t, language } = useLanguage();
  const { speak } = useSpeech();

  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(100);
  const [timeTaken, setTimeTaken] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adaptiveNote, setAdaptiveNote] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions from Caretaker's Memory Album
  const buildQuestions = (album: MemoryAlbumItem[]): QuestionItem[] => {
    const enabledItems = album.filter((item) => item.enabledForGame);
    const pool = enabledItems.length > 0 ? enabledItems : album;

    if (pool.length === 0) return [];

    return pool.map((item, idx) => {
      const correct = item.person || item.title;
      // Distractors
      const distractorPool = [
        "Family Friend",
        "Uncle Rajesh",
        "Aarav (Grandson)",
        "Priya (Daughter)",
        "Sunil (Brother)",
        "Grandfather",
        "Neighbor Sharmaji"
      ].filter((d) => d.toLowerCase() !== correct.toLowerCase());

      const chosenDistractors = distractorPool.slice(0, 2);
      const allOptions = [correct, ...chosenDistractors];

      // Shuffle options
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }

      const qText =
        language === "bn"
          ? `এই ছবিতে কাকে দেখা যাচ্ছে?`
          : language === "hi"
          ? `इस तस्वीर में कौन दिखाई दे रहे हैं?`
          : `Who is shown in this family photograph?`;

      return {
        id: item.id || `fr-${idx}`,
        question: qText,
        image: item.image,
        correctAnswer: correct,
        options: allOptions,
        context: `${item.title} ${item.year ? `(${item.year})` : ""}`
      };
    });
  };

  const startNewGame = (diff: DifficultyLevel = difficulty) => {
    const album = getMemoryAlbum(patientId);
    const qList = buildQuestions(album);
    setQuestions(qList);
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
  }, [difficulty, patientId]);

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

  const handleOptionSelect = (opt: string) => {
    if (isAnswerChecked || isCompleted) return;

    setSelectedOption(opt);
    setIsAnswerChecked(true);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      const fb = t("game.feedback.correct");
      setFeedback(fb);
      if (soundEnabled) speak(fb, "fr-correct");
    } else {
      const fb = t("game.feedback.incorrect", { answer: currentQ.correctAnswer });
      setFeedback(fb);
      setScore((prev) => Math.max(40, prev - 15));
      if (soundEnabled) speak(fb, "fr-incorrect");
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
      gameId: "family_recall",
      domain: "Memory & Recall",
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

  const instructionText = t("game.familyRecall.instruction");

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-slate-200 text-center">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">{t("game.familyRecall.title")}</h3>
        <p className="text-slate-600 text-sm mb-6">{t("game.familyRecall.empty")}</p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 mb-1">
            {t("common.domain")}: {t("games.domain.familyRecall")}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            {t("game.familyRecall.title")}
            <SpeakButton text={`${t("game.familyRecall.title")}. ${instructionText}`} id="fr-title" size="sm" />
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
          <span className="text-base font-bold text-emerald-600">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-center text-sm font-medium flex items-center justify-center gap-2">
          <span>{feedback}</span>
        </div>
      )}

      {/* Spec: Layout order: Question → Large image → Answer options */}
      {!isCompleted && currentQ && (
        <div className="space-y-4">
          {/* 1. Question (BEFORE IMAGE) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">{currentQ.question}</h3>
            <SpeakButton text={currentQ.question} id={`fr-q-${currentIndex}`} size="md" />
          </div>

          {/* 2. Large Image (object-fit: contain, subtle border, rounded) */}
          <div className="w-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 p-2 sm:p-4 max-h-[360px]">
            <img
              src={currentQ.image}
              alt="Family Memory"
              className="max-h-[320px] w-auto max-w-full object-contain rounded-xl shadow-sm"
            />
            {currentQ.context && (
              <span className="text-xs text-slate-500 mt-2 font-medium">{currentQ.context}</span>
            )}
          </div>

          {/* 3. Answer Options (A/B/C) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {currentQ.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

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
                  key={`opt-${idx}`}
                  type="button"
                  disabled={isAnswerChecked}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-4 rounded-xl text-left border-2 transition-all cursor-pointer shadow-sm flex items-center gap-3 disabled:cursor-not-allowed ${btnStyle}`}
                >
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                    {letter}
                  </span>
                  <span className="text-base font-medium">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Dialog */}
      {isCompleted && (
        <div className="mt-6 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-600 text-white flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{t("game.feedback.completed")}</h3>
          <p className="text-slate-600 mt-1">{t("game.feedback.sessionSummary", { score })}</p>
          {adaptiveNote && <p className="text-xs text-rose-700 mt-2 font-medium">{adaptiveNote}</p>}

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
