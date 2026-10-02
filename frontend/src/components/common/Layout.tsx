import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Brain,
  BookOpen,
  TrendingUp,
  Pill,
  HelpCircle,
  Mic,
  User as UserIcon,
  Settings,
  Bell,
  Image as ImageIcon,
  FileText,
  Search,
  LogOut,
  Flame,
  PhoneCall,
  Activity
} from "lucide-react";
import { Role, User, Patient } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { VoiceAssistantModal } from "../patient/VoiceAssistantModal";

interface LayoutProps {
  user: User;
  patient?: Patient;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  patient,
  activeTab,
  onSelectTab,
  onLogout,
  children
}) => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);

  // Define sidebar navigation items per role strictly based on spec
  const getNavItems = () => {
    if (user.role === "patient") {
      return [
        { id: "dashboard", label: t("nav.patient.dashboard"), icon: LayoutDashboard },
        { id: "games", label: t("nav.patient.games"), icon: Brain },
        { id: "memory-lane", label: t("nav.patient.memoryLane"), icon: BookOpen },
        { id: "progress", label: t("nav.patient.progress"), icon: TrendingUp },
        { id: "medicine", label: t("nav.patient.medicine"), icon: Pill },
        { id: "help", label: t("nav.patient.help"), icon: HelpCircle },
        { id: "voice", label: t("nav.patient.voice"), icon: Mic, isVoice: true },
        { id: "profile", label: t("nav.patient.profile"), icon: UserIcon },
        { id: "settings", label: t("nav.patient.settings"), icon: Settings }
      ];
    }

    if (user.role === "caretaker") {
      return [
        { id: "dashboard", label: t("nav.caretaker.dashboard"), icon: LayoutDashboard },
        { id: "alerts", label: t("nav.caretaker.alerts"), icon: Bell },
        { id: "memory-album", label: t("nav.caretaker.memoryAlbum"), icon: ImageIcon },
        { id: "prescriptions", label: t("nav.caretaker.prescriptions"), icon: FileText },
        { id: "progress", label: t("nav.caretaker.progress"), icon: TrendingUp },
        { id: "profile", label: t("nav.caretaker.profile"), icon: UserIcon },
        { id: "settings", label: t("nav.caretaker.settings"), icon: Settings }
      ];
    }

    // Doctor
    return [
      { id: "dashboard", label: t("nav.doctor.dashboard"), icon: Search },
      { id: "performance", label: t("nav.doctor.performance"), icon: Activity },
      { id: "prescriptions", label: t("nav.doctor.prescriptions"), icon: FileText },
      { id: "profile", label: t("nav.doctor.profile"), icon: UserIcon },
      { id: "settings", label: t("nav.doctor.settings"), icon: Settings }
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = (item: { id: string; isVoice?: boolean }) => {
    if (item.isVoice) {
      setVoiceAssistantOpen(true);
    } else {
      onSelectTab(item.id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Compact Navbar: h-10 mobile / sm:h-11 */}
      <header className="h-10 sm:h-11 bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger button on mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              R
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base hidden xs:inline">
              RECALLED
            </span>
          </div>

          {/* Compact CHI and Streak Badges (for Patient) */}
          {user.role === "patient" && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                CHI 79
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                5d Streak
              </span>
            </div>
          )}
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Voice Assistant button */}
          <button
            type="button"
            onClick={() => setVoiceAssistantOpen(true)}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer"
            title={t("speech.voiceAssistant")}
            aria-label={t("speech.voiceAssistant")}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Quick SOS button for patient */}
          {user.role === "patient" && (
            <button
              type="button"
              onClick={() => onSelectTab("help")}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>
          )}

          {/* Compact Language Selector in Header */}
          <LanguageSelector variant="compact" />

          {/* User Role Badge & Logout */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden md:inline">
              {user.role}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
              title={t("auth.logout")}
              aria-label={t("auth.logout")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Desktop Sidebar & Mobile Drawer */}
      <div className="flex flex-1 w-full max-w-full">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-white border-r border-slate-200 p-3 sm:p-4 shrink-0 space-y-1">
          <div className="pb-3 mb-2 border-b border-slate-100 px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Logged in as
            </span>
            <span className="text-sm font-bold text-slate-800 line-clamp-1">{user.name}</span>
            <span className="text-xs text-blue-700 font-semibold capitalize">{user.role} view</span>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Non-diagnostic footer in sidebar */}
          <div className="pt-3 border-t border-slate-100 px-2">
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              {t("app.nonDiagnosticShort")}
            </p>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Panel */}
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col p-4 z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                  <span className="text-xs text-blue-700 font-semibold capitalize">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 py-2 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={`mob-${item.id}`}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("auth.logout")}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        patientId={patient?.id || "p1"}
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        onNavigate={(tab) => {
          onSelectTab(tab);
          setVoiceAssistantOpen(false);
        }}
      />
    </div>
  );
};
