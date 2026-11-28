import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Copy,
  ShieldCheck,
  AlertCircle,
  Clock,
  Trash2,
  LayoutDashboard,
  BellRing,
  Activity
} from "lucide-react";
import {
  ConnectedPatientSummary,
  ConnectionDirectoryProfile,
  ConnectionRequest,
  User
} from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  disconnectRelationship,
  fetchConnectedPatients,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  rejectConnectionRequest,
  searchConnectionTarget,
  sendConnectionRequest
} from "../../services/connectionApi";
import { getCaretakers } from "../../utils/storage";

interface MyPatientsPageProps {
  user: User;
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onConnectionsChanged?: () => void;
}

export const MyPatientsPage: React.FC<MyPatientsPageProps> = ({
  user,
  selectedPatientId,
  onSelectPatient,
  onNavigateToTab,
  onConnectionsChanged
}) => {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<ConnectionDirectoryProfile | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [connected, setConnected] = useState<ConnectedPatientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<ConnectedPatientSummary | null>(null);

  const caretakerProfile = getCaretakers().find((c) => c.id === user.caretakerId);
  const myUserId = user.id;
  const myInviteCode =
    caretakerProfile?.inviteCode ||
    user.inviteCode ||
    `CARE-${(user.caretakerId || user.id).toUpperCase()}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inc, out, conn] = await Promise.all([
        fetchIncomingRequests(user),
        fetchOutgoingRequests(user),
        fetchConnectedPatients(user)
      ]);
      setIncoming(inc);
      setOutgoing(out);
      setConnected(conn);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(myInviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setSearchResult(null);
    const res = await searchConnectionTarget(user, searchQuery);
    if (!res.ok || !res.data) {
      setBanner({ type: "error", text: res.error || "No patient found." });
      return;
    }
    setSearchResult(res.data);
  };

  const handleSendRequest = async (targetId: string) => {
    setBanner(null);
    setBusyId(targetId);
    const res = await sendConnectionRequest(user, targetId, requestNote);
    setBusyId(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Could not send connection request." });
      return;
    }

    setBanner({
      type: "success",
      text: `Connection request sent to ${searchResult?.name || targetId}. Access begins only after they accept.`
    });
    setRequestNote("");
    setSearchResult((prev) => (prev ? { ...prev, connectionStatus: "PENDING_OUTGOING" } : null));
    await loadData();
    onConnectionsChanged?.();
  };

  const handleAccept = async (req: ConnectionRequest) => {
    setBanner(null);
    setBusyId(req.id);
    const res = await acceptConnectionRequest(user, req.id);
    setBusyId(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Unable to accept request." });
      return;
    }

    setBanner({
      type: "success",
      text: `${req.senderName} is now connected. You can view their care dashboard and manage reminders.`
    });
    if (res.data?.relationship?.patientId) {
      onSelectPatient(res.data.relationship.patientId);
    }
    await loadData();
    onConnectionsChanged?.();
  };

  const handleReject = async (req: ConnectionRequest) => {
    setBanner(null);
    setBusyId(req.id);
    const res = await rejectConnectionRequest(user, req.id);
    setBusyId(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Unable to reject request." });
      return;
    }
    setBanner({ type: "success", text: `Request from ${req.senderName} declined.` });
    await loadData();
  };

  const handleCancel = async (req: ConnectionRequest) => {
    setBanner(null);
    setBusyId(req.id);
    const res = await cancelConnectionRequest(user, req.id);
    setBusyId(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Unable to cancel request." });
      return;
    }
    setBanner({ type: "success", text: `Cancelled connection request to ${req.receiverName}.` });
    await loadData();
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTarget) return;
    setBanner(null);
    setBusyId(disconnectTarget.relationshipId);
    const res = await disconnectRelationship(
      user,
      disconnectTarget.relationshipId,
      disconnectTarget.patient.id,
      disconnectTarget.caregiverId
    );
    setBusyId(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Failed to disconnect patient." });
      setDisconnectTarget(null);
      return;
    }

    const removedName = disconnectTarget.patient.name;
    const removedPid = disconnectTarget.patient.id;
    setDisconnectTarget(null);
    setBanner({
      type: "success",
      text: `Disconnected ${removedName}. Other connected patients remain unaffected.`
    });

    const updated = await fetchConnectedPatients(user);
    setConnected(updated);
    if (selectedPatientId === removedPid && updated.length > 0) {
      onSelectPatient(updated[0].patient.id);
    }
    onConnectionsChanged?.();
  };

  const pendingIncoming = incoming.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {t("connections.myPatientsTitle")}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-0.5">
              {t("connections.myPatientsSubtitle")}
            </p>
          </div>
        </div>

        {/* Shareable Caregiver ID & Code */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 sm:px-4 space-y-1.5 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            {t("connections.yourIdCard")}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-mono font-bold text-slate-800">
              {myInviteCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t("connections.copied") : t("connections.copyCode")}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            {t("connections.userId")}: <strong className="font-mono text-slate-800">{myUserId}</strong>
          </p>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {banner && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-semibold ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {banner.type === "success" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connected Patients Cards (Multi-Patient Switcher & Summaries) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>{t("connections.connectedPatients")}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {connected.length}
            </span>
          </h2>
          {loading && <span className="text-xs text-slate-400">{t("common.loading")}</span>}
        </div>

        {connected.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
            {t("connections.noPatients")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {connected.map((item) => {
              const isSelected = item.patient.id === selectedPatientId;
              return (
                <motion.div
                  key={item.relationshipId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-lg shrink-0">
                          {item.patient.avatar ? (
                            <img
                              src={item.patient.avatar}
                              alt={item.patient.name}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            item.patient.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">
                              {item.patient.name}
                            </h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            {item.patient.age} Y • {item.patient.region}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {item.patient.inviteCode || item.patient.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Isolated Patient Summary Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">
                          {t("connections.pendingReminders")}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {item.pendingRemindersCount}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">
                          {t("connections.avgProgress")}
                        </span>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {item.averageScore}%
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-500 text-[11px] block">
                          {t("connections.latestActivity")}
                        </span>
                        <span className="font-semibold text-slate-800 capitalize truncate block">
                          {item.latestActivity || t("connections.noActivityYet")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPatient(item.patient.id);
                        onNavigateToTab("dashboard");
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>{t("connections.openDashboard")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPatient(item.patient.id);
                        onNavigateToTab("reminders");
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{t("connections.manageReminders")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisconnectTarget(item)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                      title={t("connections.disconnect")}
                      aria-label={`${t("connections.disconnect")} ${item.patient.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Find & Connect New Patient */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">{t("connections.findPatient")}</h2>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("connections.searchPlaceholderPatient")}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{t("common.search")}</span>
          </button>
        </form>

        {searchResult && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-lg shrink-0">
                  {searchResult.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{searchResult.name}</h3>
                  <p className="text-xs text-slate-600">
                    {searchResult.age ? `${searchResult.age} Y • ` : ""}
                    {searchResult.region || "Patient"} • Code:{" "}
                    <span className="font-mono font-bold text-slate-800">{searchResult.inviteCode}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {searchResult.userId}</p>
                </div>
              </div>

              {searchResult.connectionStatus === "CONNECTED" ? (
                <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {t("connections.status.CONNECTED")}
                </span>
              ) : searchResult.connectionStatus === "PENDING_OUTGOING" ? (
                <span className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {t("connections.status.PENDING")}
                </span>
              ) : searchResult.connectionStatus === "PENDING_INCOMING" ? (
                <span className="px-3.5 py-2 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold">
                  Incoming request waiting below
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busyId === searchResult.userId}
                  onClick={() => handleSendRequest(searchResult.userId)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t("connections.sendRequest")}</span>
                </button>
              )}
            </div>

            {searchResult.connectionStatus === "NONE" && (
              <input
                type="text"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder={t("connections.optionalMessage")}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>
        )}
      </div>

      {/* Incoming & Outgoing Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Requests */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{t("connections.incomingRequests")}</span>
              {pendingIncoming.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  {pendingIncoming.length}
                </span>
              )}
            </h2>
          </div>

          {pendingIncoming.length === 0 ? (
            <p className="text-sm text-slate-500">{t("connections.noIncoming")}</p>
          ) : (
            <div className="space-y-3">
              {pendingIncoming.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40 space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">{req.senderName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                        {t(`connections.status.${req.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      ID: {req.senderId} {req.senderInviteCode ? `• ${req.senderInviteCode}` : ""}
                    </p>
                    {req.message && (
                      <p className="text-xs text-slate-700 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-100 mt-2">
                        “{req.message}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleAccept(req)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t("connections.accept")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleReject(req)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t("connections.reject")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing Requests */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">{t("connections.outgoingRequests")}</h2>
          {outgoing.length === 0 ? (
            <p className="text-sm text-slate-500">{t("connections.noOutgoing")}</p>
          ) : (
            <div className="space-y-2.5">
              {outgoing.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.receiverName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          req.status === "PENDING"
                            ? "bg-amber-100 text-amber-900"
                            : req.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {t(`connections.status.${req.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      ID: {req.receiverId}{" "}
                      {req.receiverInviteCode ? `• ${req.receiverInviteCode}` : ""}
                    </p>
                  </div>

                  {req.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleCancel(req)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer shrink-0"
                    >
                      {t("connections.cancelRequest")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {disconnectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t("connections.confirmDisconnectTitle")}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("connections.confirmDisconnectBody", { name: disconnectTarget.patient.name })}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDisconnectTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={busyId === disconnectTarget.relationshipId}
                onClick={handleConfirmDisconnect}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer"
              >
                {t("connections.confirmDisconnectBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
