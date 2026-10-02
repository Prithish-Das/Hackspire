import React, { useState } from "react";
import { Mic, MicOff, X, Volume2, Sparkles } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import { getReminders } from "../../utils/storage";
import { getLocaleCode } from "../../utils/speech";

interface VoiceAssistantModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onNavigate
}) => {
  const { t, language } = useLanguage();
  const { speak, isSpeaking, stop } = useSpeech();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickCommands = [
    {
      label: {
        en: "Start my memory game",
        bn: "আমার স্মৃতির খেলা শুরু করো",
        hi: "मेरा मेमोरी गेम शुरू करो"
      },
      action: () => {
        const text =
          language === "bn"
            ? "নিশ্চয়ই, চলুন স্মৃতির অনুশীলন শুরু করি।"
            : language === "hi"
            ? "ज़रूर, चलिए मेमोरी गेम शुरू करते हैं।"
            : "Opening your cognitive memory games now.";
        setReply(text);
        speak(text, "va-reply");
        setTimeout(() => {
          onClose();
          onNavigate("games");
        }, 1500);
      }
    },
    {
      label: {
        en: "What medicines do I have today?",
        bn: "আজ আমার কী কী ঔষধ আছে?",
        hi: "आज मुझे कौन सी दवाइयां लेनी हैं?"
      },
      action: () => {
        const meds = getReminders(patientId).filter((r) => r.type === "medicine");
        const count = meds.length;
        const text =
          language === "bn"
            ? `আজ আপনার মোট ${count}টি ঔষধের রুটিন রয়েছে।`
            : language === "hi"
            ? `आज आपके शेड्यूल में कुल ${count} दवाइयां हैं।`
            : `You have ${count} scheduled medicines today.`;
        setReply(text);
        speak(text, "va-reply");
      }
    },
    {
      label: {
        en: "Show my progress",
        bn: "আমার অগ্রগতি দেখাও",
        hi: "मेरी प्रगति दिखाओ"
      },
      action: () => {
        const text =
          language === "bn"
            ? "আপনার অগ্রগতির বিবরণ খুলছি।"
            : language === "hi"
            ? "आपकी प्रगति का विवरण खोला जा रहा है।"
            : "Opening your activity progress now.";
        setReply(text);
        speak(text, "va-reply");
        setTimeout(() => {
          onClose();
          onNavigate("progress");
        }, 1500);
      }
    },
    {
      label: {
        en: "Call my caregiver",
        bn: "পরিচর্যাকারীকে কল করো",
        hi: "देखभालकर्ता को कॉल करो"
      },
      action: () => {
        const text =
          language === "bn"
            ? "আপনার পরিচর্যাকারীর সাথে যোগাযোগ করানো হচ্ছে।"
            : language === "hi"
            ? "आपकी देखभालकर्ता से संपर्क किया जा रहा है।"
            : "Connecting you with your caregiver now.";
        setReply(text);
        speak(text, "va-reply");
        setTimeout(() => {
          onClose();
          onNavigate("help");
        }, 1500);
      }
    }
  ];

  const handleStartListening = () => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback
      setTranscript("Speech recognition not supported in this browser. Please tap any command below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getLocaleCode(language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setTranscript(t("speech.listening"));

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        processSpokenQuery(spoken);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const processSpokenQuery = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("game") || lower.includes("খেলা") || lower.includes("खेल")) {
      quickCommands[0].action();
    } else if (lower.includes("medicine") || lower.includes("ঔষধ") || lower.includes("দবা") || lower.includes("दवा")) {
      quickCommands[1].action();
    } else if (lower.includes("progress") || lower.includes("অগ্রগতি") || lower.includes("प्रगति")) {
      quickCommands[2].action();
    } else if (lower.includes("caregiver") || lower.includes("পরিচর্যাকারী") || lower.includes("help") || lower.includes("सहायता")) {
      quickCommands[3].action();
    } else {
      const fallbackReply =
        language === "bn"
          ? `আমি শুনেছি: "${text}"। আপনি নীচের তালিকা থেকে বেছে নিতে পারেন।`
          : language === "hi"
          ? `मैंने सुना: "${text}"। आप नीचे दिए गए विकल्पों में से चुन सकते हैं।`
          : `I heard: "${text}". You can select from the convenient commands below.`;
      setReply(fallbackReply);
      speak(fallbackReply, "va-reply");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900">{t("speech.voiceAssistant")}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stop();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Trigger Bubble */}
        <div className="my-6 flex flex-col items-center justify-center text-center">
          <button
            type="button"
            onClick={isListening ? () => setIsListening(false) : handleStartListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              isListening
                ? "bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse"
                : "bg-blue-600 hover:bg-blue-700 text-white ring-4 ring-blue-100"
            }`}
          >
            {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <span className="text-xs font-semibold text-slate-500 mt-3">
            {isListening ? t("speech.listening") : t("speech.tapToSpeak")}
          </span>

          {transcript && (
            <p className="mt-2 text-xs sm:text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl max-w-xs font-medium">
              "{transcript}"
            </p>
          )}

          {reply && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-xs sm:text-sm font-semibold max-w-xs">
              {reply}
            </div>
          )}
        </div>

        {/* Quick elder-friendly command buttons */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Suggested Commands:
          </span>
          <div className="space-y-2">
            {quickCommands.map((cmd, idx) => {
              const labelText = cmd.label[language] || cmd.label.en;
              return (
                <button
                  key={`cmd-${idx}`}
                  type="button"
                  onClick={cmd.action}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{labelText}</span>
                  <span className="text-xs text-blue-600 font-bold">Ask →</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
