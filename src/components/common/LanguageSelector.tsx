import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Locale } from "../../i18n/translations";

interface LanguageSelectorProps {
  variant?: "header" | "large" | "compact";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "header",
  className = ""
}) => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Locale; label: string; nativeName: string }[] = [
    { code: "en", label: "English", nativeName: "English" },
    { code: "bn", label: "Bengali", nativeName: "বাংলা" },
    { code: "hi", label: "Hindi", nativeName: "हिन्दी" }
  ];

  if (variant === "large") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm sm:text-base transition-all cursor-pointer shadow-xs ${
              language === lang.code
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105"
                : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-300"
            }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Locale)}
        aria-label="Language"
        className="pl-7 pr-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 border-none text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
      >
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
        <option value="hi">हिन्दी</option>
      </select>
    </div>
  );
};
