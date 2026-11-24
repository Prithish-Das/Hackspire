import React, { useState } from "react";
import { Droplet, Check, X } from "lucide-react";
import { WaterQuantity } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { SpeakButton } from "../common/SpeakButton";

interface WaterConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: WaterQuantity) => void;
}

export const WaterConfirmDialog: React.FC<WaterConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useLanguage();
  const [selectedQty, setSelectedQty] = useState<WaterQuantity>("one_glass");

  if (!isOpen) return null;

  const quantities: { id: WaterQuantity; labelKey: string; icon: string }[] = [
    { id: "small_amount", labelKey: "water.qty.small", icon: "🥛" },
    { id: "half_glass", labelKey: "water.qty.half", icon: "🥛" },
    { id: "one_glass", labelKey: "water.qty.one", icon: "🥤" },
    { id: "more_than_one_glass", labelKey: "water.qty.more", icon: "💧" },
    { id: "not_sure", labelKey: "water.qty.notSure", icon: "❓" }
  ];

  const questionText = t("water.dialog.question");

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
          <Droplet className="w-8 h-8 fill-sky-500" />
        </div>

        {/* Title & Question */}
        <div className="text-center mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            {t("water.dialog.title")}
            <SpeakButton text={`${t("water.dialog.title")}. ${questionText}`} id="water-confirm-title" size="sm" />
          </h3>
          <p className="text-base text-slate-700 mt-1 font-medium">{questionText}</p>
        </div>

        {/* Quantity Selection */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 mb-2">
            {t("water.dialog.qtyTitle")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quantities.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedQty(item.id)}
                className={`p-3 rounded-xl text-left border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                  selectedQty === item.id
                    ? "border-sky-500 bg-sky-50 text-sky-900 font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs sm:text-sm">{t(item.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Elder-friendly large touch targets */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onConfirm(selectedQty)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-sm text-sm sm:text-base cursor-pointer"
          >
            <Check className="w-5 h-5" />
            {t("water.dialog.yes")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm sm:text-base cursor-pointer"
          >
            <X className="w-5 h-5" />
            {t("water.dialog.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};
