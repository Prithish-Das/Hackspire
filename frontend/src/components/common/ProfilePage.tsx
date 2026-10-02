import React, { useState } from "react";
import { User, Phone, MapPin, Calendar, Check, Save } from "lucide-react";
import { Patient, Role, User as UserType } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { updatePatient } from "../../utils/storage";

interface ProfilePageProps {
  user: UserType;
  patient?: Patient;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, patient }) => {
  const { t } = useLanguage();

  const [name, setName] = useState(patient?.name || user.name);
  const [region, setRegion] = useState(patient?.region || "Kolkata, West Bengal");
  const [birthYear, setBirthYear] = useState(patient?.birthYear ? String(patient.birthYear) : "1952");
  const [emergencyPhone, setEmergencyPhone] = useState(
    patient?.emergencyContact?.phone || "+91 98765 43210"
  );
  const [emergencyName, setEmergencyName] = useState(
    patient?.emergencyContact?.name || "Priya Sharma (Daughter)"
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (patient) {
      const updated: Patient = {
        ...patient,
        name: name.trim(),
        region: region.trim(),
        birthYear: parseInt(birthYear, 10) || 1952,
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relation: "Primary Contact"
        }
      };
      updatePatient(updated);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
          {name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">
              Role: {user.role}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{name}</h1>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Personal Profile Details
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Region / Home State
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Birth Year</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {user.role === "patient" && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Emergency & Primary Caregiver Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Caregiver Name
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t("common.save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
