import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Info, Bell, Trash2, Check } from "lucide-react";
import { AlertItem } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getAlerts, resolveAlert } from "../../utils/storage";

interface AlertsViewProps {
  patientId: string;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ patientId }) => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AlertItem[]>(() => getAlerts(patientId));

  const handleResolve = (id: string) => {
    resolveAlert(id);
    setAlerts(getAlerts(patientId));
  };

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">{t("nav.caretaker.alerts")}</h1>
          </div>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Calm, factual alerts generated from real daily reminders and activity records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            {activeAlerts.length} Active Notice{activeAlerts.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          {t("caretaker.recentAlerts")}
        </h2>

        {activeAlerts.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800">{t("caretaker.noAlerts")}</h3>
            <p className="text-xs text-slate-500">
              Medicines, meals, and hydration schedules are functioning on track.
            </p>
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-4 transition-all ${
                alert.severity === "warning"
                  ? "bg-amber-50/70 border-amber-200 text-amber-950"
                  : "bg-blue-50/70 border-blue-200 text-blue-950"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    alert.severity === "warning" ? "text-amber-600" : "text-blue-600"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold">{alert.message}</p>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Recorded at {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleResolve(alert.id)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Acknowledge</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Resolved Alerts History */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-600">Acknowledged Care Notices</h3>
          <div className="space-y-2">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{alert.message}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(alert.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
