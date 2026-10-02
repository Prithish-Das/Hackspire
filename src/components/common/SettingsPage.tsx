import React, { useState } from "react";
import {
  Sliders,
  Type,
  Eye,
  Volume2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  WifiOff,
  UserCheck
} from "lucide-react";
import { AccessibilitySettings } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeech } from "../../contexts/SpeechContext";
import {
  getAccessibilitySettings,
  saveAccessibilitySettings,
  resetToInitialData
} from "../../utils/storage";
import { LanguageSelector } from "./LanguageSelector";

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { speechGender, setSpeechGender } = useSpeech();

  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    getAccessibilitySettings()
  );
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleUpdate = (partial: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveAccessibilitySettings(updated);
  };

  const handleResetData = () => {
    if (window.confirm(t("settings.resetConfirm"))) {
      resetToInitialData();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">{t("settings.title")}</h1>
        <p className="text-slate-600 mt-1 text-xs sm:text-sm">
          Customize font sizes, visual contrast, text-to-speech preferences, and data options.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Demo data successfully reset to initial state.</span>
        </div>
      )}

      {/* Accessibility Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Type className="w-5 h-5 text-blue-600" />
          <span>{t("settings.accessibility")}</span>
        </h2>

        {/* Font Size Choices */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-600">
            {t("settings.fontSize")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: "normal" })}
              className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                settings.fontSize === "normal"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              {t("settings.sizeNormal")}
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: "large" })}
              className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                settings.fontSize === "large"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              {t("settings.sizeLarge")}
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: "extralarge" })}
              className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                settings.fontSize === "extralarge"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              {t("settings.sizeExtraLarge")}
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          {/* High Contrast Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-slate-600" />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  {t("settings.highContrast")}
                </span>
                <span className="text-[11px] text-slate-500">
                  Increases border visibility and background contrast
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => handleUpdate({ highContrast: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-slate-600" />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  {t("settings.reducedMotion")}
                </span>
                <span className="text-[11px] text-slate-500">
                  Minimizes transitions and card movement
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => handleUpdate({ reducedMotion: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Speech & Voice Preferences */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <span>Voice & Speech Synthesis</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            {t("settings.voiceGender")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSpeechGender("female");
                handleUpdate({ speechGender: "female" });
              }}
              className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                speechGender === "female"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              {t("settings.voiceFemale")}
            </button>
            <button
              type="button"
              onClick={() => {
                setSpeechGender("male");
                handleUpdate({ speechGender: "male" });
              }}
              className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                speechGender === "male"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              {t("settings.voiceMale")}
            </button>
          </div>
        </div>

        {/* Language selector in Settings */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            {t("settings.language")}
          </label>
          <LanguageSelector variant="large" />
        </div>
      </div>

      {/* Offline & System Readiness */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {t("settings.offlineMode")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              All question banks, local memory albums, and pair matching activities function fully
              without internet connectivity.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Reset Application Data</span>
            <span className="text-[11px] text-slate-400">
              Restores initial patients, doctor prescriptions, and sample memories.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("settings.resetData")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
