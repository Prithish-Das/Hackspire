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
  HeartHandshake,
  Clock,
  Trash2
} from "lucide-react";
import {
  ConnectedCaregiverSummary,
  ConnectionDirectoryProfile,
  ConnectionRequest,
  Patient,
  User
} from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  disconnectRelationship,
  fetchConnectedCaregivers,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  rejectConnectionRequest,
  searchConnectionTarget,
  sendConnectionRequest
} from "../../services/connectionApi";
import { SpeakButton } from "../common/SpeakButton";

interface MyCaregiversPageProps {
  user: User;
  patient: Patient;
  onConnectionsChanged?: () => void;
}

export const MyCaregiversPage: React.FC<MyCaregiversPageProps> = ({
  user,
  patient,
  onConnectionsChanged
}) => {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<ConnectionDirectoryProfile | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [connected, setConnected] = useState<ConnectedCaregiverSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<ConnectedCaregiverSummary | null>(null);

  const myUserId = user.id === "u-patient" ? "u-patient-1" : user.id;
  const myInviteCode = patient.inviteCode || user.inviteCode || `PAT-${patient.id.toUpperCase()}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inc, out, conn] = await Promise.all([
        fetchIncomingRequests(user),
        fetchOutgoingRequests(user),
        fetchConnectedCaregivers(user)
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

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setSearchResult(null);
    const res = await searchConnectionTarget(user, searchQuery);
    if (!res.ok || !res.data) {
      setBanner({ type: "error", text: res.error || "No caregiver found." });
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
      setBanner({ type: "error", text: res.error || "Could not send request." });
      return;
    }

    setBanner({
      type: "success",
      text: `Connection request sent to ${searchResult?.name || targetId}. Waiting for their acceptance.`
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
      text: `${req.senderName} is now connected as your caregiver.`
    });
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
    setBanner({ type: "success", text: `Cancelled request to ${req.receiverName}.` });
    await loadData();
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTarget) return;
    setBanner(null);
    setBusyId(disconnectTarget.relationshipId);
    const res = await disconnectRelationship(
      user,
      disconnectTarget.relationshipId,
      patient.id,
      disconnectTarget.caregiver.id
    );
    setBusyId(null);

    if (!res.ok) {
      setBanner({ type: "error", text: res.error || "Failed to disconnect caregiver." });
      setDisconnectTarget(null);
      return;
    }

    setBanner({
      type: "success",
      text: `Disconnected ${disconnectTarget.caregiver.name}. They no longer have access to your care schedule.`
    });
    setDisconnectTarget(null);
    await loadData();
    onConnectionsChanged?.();
  };

  const pendingIncoming = incoming.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {t("connections.myCaregiversTitle")}
                </h1>
                <SpeakButton
                  text={`${t("connections.myCaregiversTitle")}. ${t("connections.myCaregiversSubtitle")}`}
                  id="my-caregivers-speak"
                  size="sm"
                />
              </div>
              <p className="text-slate-600 text-sm sm:text-base mt-0.5">
                {t("connections.myCaregiversSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Shareable Patient Connection Code */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 sm:px-4 space-y-2 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            {t("connections.yourIdCard")}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-mono font-bold text-slate-800">
              {myInviteCode}
            </div>
            <button
              type="button"
              onClick={() => handleCopy("code", myInviteCode)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              {copiedField === "code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === "code" ? t("connections.copied") : t("connections.copyCode")}</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span>
              {t("connections.userId")}: <strong className="font-mono text-slate-800">{myUserId}</strong>
            </span>
          </div>
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

      {/* Search Caregiver Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">{t("connections.findCaregiver")}</h2>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("connections.searchPlaceholderCaregiver")}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-sm cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{t("common.search")}</span>
          </button>
        </form>

        {/* Search Result Preview */}
        {searchResult && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-lg shrink-0">
                  {searchResult.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{searchResult.name}</h3>
                  <p className="text-xs text-slate-600 font-medium">
                    {searchResult.relationshipLabel || "Caregiver"} • Code:{" "}
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
                  Already sent you a request below
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
      </motion.div>

      {/* Incoming Caregiver Requests */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>{t("connections.incomingRequests")}</span>
            {pendingIncoming.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
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
                className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{req.senderName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                      {t(`connections.status.${req.status}`)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {req.senderId} {req.senderInviteCode ? `• ${req.senderInviteCode}` : ""}
                  </p>
                  {req.message && (
                    <p className="text-sm text-slate-700 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-100 mt-1">
                      “{req.message}”
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => handleAccept(req)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t("connections.accept")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => handleReject(req)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-sm cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>{t("connections.reject")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Caregivers List */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{t("connections.connectedCaregivers")}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {connected.length}
            </span>
          </h2>
          {loading && <span className="text-xs text-slate-400">{t("common.loading")}</span>}
        </div>

        {connected.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
            {t("connections.noCaregivers")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connected.map((item) => (
              <div
                key={item.relationshipId}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg shrink-0">
                    {item.caregiver.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900">{item.caregiver.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {item.caregiver.relationshipLabel || "Family Caregiver"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.caregiver.phone} • {item.caregiver.email}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {t("connections.connectedSince", {
                        date: new Date(item.connectedAt).toLocaleDateString()
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                  <span className="text-[11px] font-mono text-slate-500">
                    {item.caregiver.inviteCode || item.caregiver.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDisconnectTarget(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("connections.disconnect")}</span>
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
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                    ID: {req.receiverId} {req.receiverInviteCode ? `• ${req.receiverInviteCode}` : ""}
                  </p>
                </div>

                {req.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => handleCancel(req)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer self-start sm:self-auto"
                  >
                    {t("connections.cancelRequest")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {disconnectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t("connections.confirmDisconnectTitle")}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("connections.confirmDisconnectBody", { name: disconnectTarget.caregiver.name })}
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
