import {
  Caretaker,
  ConnectedCaregiverSummary,
  ConnectedPatientSummary,
  ConnectionDirectoryProfile,
  ConnectionRequest,
  Patient,
  PatientCaregiverRelationship,
  Reminder,
  ReminderCategory,
  ReminderStatus,
  RepeatFrequency,
  Role,
  User
} from "../types";
import {
  categoryToReminderType,
  deleteReminder,
  getCaretakers,
  getConnectedCaregiversForPatient,
  getConnectedPatientSummariesForCaregiver,
  getConnectionRequests,
  getPatientById,
  getPatients,
  getRelationships,
  getReminders,
  normalizePatientRecord,
  normalizeReminderRecord,
  replacePatientReminders,
  saveCaretaker,
  saveConnectionRequests,
  saveReminder,
  syncRelationshipToEntities,
  updatePatient,
  updateReminderStatus
} from "../utils/storage";

const API_BASE_URL = "/api/v1";

// Keep auth token strictly in JS module memory (never localStorage)
let sessionToken: string | null = null;
let sessionUserId: string | null = null;

export function setBackendAuthToken(token: string | null, userId?: string | null): void {
  sessionToken = token;
  sessionUserId = userId ?? null;
}

export function getBackendAuthToken(): string | null {
  return sessionToken;
}

export function clearBackendAuthToken(): void {
  sessionToken = null;
  sessionUserId = null;
}

export interface ApiActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
  fromBackend?: boolean;
}

function buildHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (sessionToken) headers["Authorization"] = `Bearer ${sessionToken}`;
  return headers;
}

async function parseErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.detail === "string" && body.detail.trim()) {
      return body.detail;
    }
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}

export async function ensureBackendSession(user: User | null): Promise<boolean> {
  if (!user) {
    clearBackendAuthToken();
    return false;
  }

  const normalizedUserId = user.id === "u-patient" ? "u-patient-1" : user.id;
  if (sessionToken && sessionUserId === normalizedUserId) {
    return true;
  }

  try {
    const patient = user.patientId ? getPatientById(user.patientId) : undefined;
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: normalizedUserId,
        name: user.name,
        email: user.email,
        role: user.role,
        inviteCode: user.inviteCode || patient?.inviteCode,
        patientId: user.patientId,
        caretakerId: user.caretakerId,
        doctorId: user.doctorId,
        age: patient?.age,
        region: patient?.region,
        language: patient?.language
      })
    });

    if (!res.ok) return false;
    const data = await res.json();
    if (data?.token) {
      setBackendAuthToken(data.token, data.user?.id || normalizedUserId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function registerWithBackend(params: {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  inviteCode?: string;
  patientId?: string;
  caretakerId?: string;
  doctorId?: string;
  phone?: string;
  age?: number;
  region?: string;
  language?: string;
}): Promise<ApiActionResult<{ token: string; user: User }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: await parseErrorDetail(res, "Registration failed.")
      };
    }
    const data = await res.json();
    if (data?.token) {
      setBackendAuthToken(data.token, data.user?.id);
    }
    return { ok: true, data, fromBackend: true };
  } catch {
    return { ok: false, error: "Backend unreachable" };
  }
}

export async function loginWithBackend(params: {
  email: string;
  password: string;
  role: Role;
}): Promise<ApiActionResult<{ token: string; user: User }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: await parseErrorDetail(res, "Invalid credentials.")
      };
    }
    const data = await res.json();
    if (data?.token) {
      setBackendAuthToken(data.token, data.user?.id);
    }
    return { ok: true, data, fromBackend: true };
  } catch {
    return { ok: false, error: "Backend unreachable" };
  }
}

// --- Local Synchronization Helpers ---
function resolveUserIdentity(user: User) {
  return {
    ...user,
    id: user.id === "u-patient" ? "u-patient-1" : user.id
  };
}

function getAllKnownDirectoryUsers(): {
  userId: string;
  entityId: string;
  role: "patient" | "caretaker";
  name: string;
  inviteCode: string;
  profileImage?: string;
  age?: number;
  region?: string;
  relationshipLabel?: string;
}[] {
  const patients = getPatients();
  const caretakers = getCaretakers();

  const patientEntries = patients.map((p) => ({
    userId: p.userId || `u-patient-${p.id.replace(/^p-?/, "")}`,
    entityId: p.id,
    role: "patient" as const,
    name: p.name,
    inviteCode: p.inviteCode || `PAT-${p.id.toUpperCase()}`,
    profileImage: p.avatar,
    age: p.age,
    region: p.region
  }));

  const caretakerEntries = caretakers.map((c) => ({
    userId: c.userId || `u-${c.id}`,
    entityId: c.id,
    role: "caretaker" as const,
    name: c.name,
    inviteCode: c.inviteCode || `CARE-${c.id.toUpperCase()}`,
    profileImage: c.profileImage,
    relationshipLabel: c.relationshipLabel || "Family Caregiver"
  }));

  return [...patientEntries, ...caretakerEntries];
}

function upsertRequestInLocal(req: ConnectionRequest): void {
  const all = getConnectionRequests();
  const idx = all.findIndex((r) => r.id === req.id);
  if (idx >= 0) {
    all[idx] = req;
    saveConnectionRequests(all);
  } else {
    saveConnectionRequests([req, ...all]);
  }
}

// --- Connection Directory & Requests ---
export async function searchConnectionTarget(
  currentUser: User,
  query: string
): Promise<ApiActionResult<ConnectionDirectoryProfile>> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { ok: false, error: "Please enter a unique User ID or invitation code." };
  }

  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/connections/search?query=${encodeURIComponent(cleanQuery)}`,
        { headers: buildHeaders(false) }
      );
      if (res.ok) {
        const data: ConnectionDirectoryProfile = await res.json();
        return { ok: true, data, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "User not found.")
        };
      }
    } catch {
      // Fall back to local search
    }
  }

  // Local fallback search
  if (me.role !== "patient" && me.role !== "caretaker") {
    return { ok: false, error: "Only patients and caregivers can search connections." };
  }

  const targetRole = me.role === "patient" ? "caretaker" : "patient";
  const qLower = cleanQuery.toLowerCase();
  const match = getAllKnownDirectoryUsers().find(
    (entry) =>
      entry.role === targetRole &&
      (entry.userId.toLowerCase() === qLower ||
        entry.entityId.toLowerCase() === qLower ||
        entry.inviteCode.toLowerCase() === qLower)
  );

  if (!match) {
    return {
      ok: false,
      error: `No ${targetRole === "caretaker" ? "caregiver" : "patient"} found matching '${cleanQuery}'.`
    };
  }

  const patientId = me.role === "patient" ? me.patientId : match.entityId;
  const caregiverId = me.role === "caretaker" ? me.caretakerId : match.entityId;

  const isConnected = Boolean(
    patientId &&
      caregiverId &&
      getRelationships().some(
        (r) => r.patientId === patientId && r.caregiverId === caregiverId && r.status === "ACTIVE"
      )
  );
  const requests = getConnectionRequests();
  const pendingOut = requests.find(
    (r) => r.status === "PENDING" && r.senderId === me.id && r.receiverId === match.userId
  );
  const pendingIn = requests.find(
    (r) => r.status === "PENDING" && r.senderId === match.userId && r.receiverId === me.id
  );

  return {
    ok: true,
    data: {
      userId: match.userId,
      entityId: match.entityId,
      name: match.name,
      role: match.role,
      inviteCode: match.inviteCode,
      profileImage: match.profileImage,
      age: match.age,
      region: match.region,
      relationshipLabel: match.relationshipLabel,
      connectionStatus: isConnected
        ? "CONNECTED"
        : pendingOut
        ? "PENDING_OUTGOING"
        : pendingIn
        ? "PENDING_INCOMING"
        : "NONE",
      pendingRequestId: pendingOut?.id || pendingIn?.id
    }
  };
}

export async function sendConnectionRequest(
  currentUser: User,
  targetIdOrCode: string,
  message?: string
): Promise<ApiActionResult<ConnectionRequest>> {
  const me = resolveUserIdentity(currentUser);
  const cleanTarget = targetIdOrCode.trim();
  if (!cleanTarget) {
    return { ok: false, error: "Target user ID or invitation code is required." };
  }

  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/request`, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify({ targetId: cleanTarget, message })
      });
      if (res.ok) {
        const created: ConnectionRequest = await res.json();
        upsertRequestInLocal(created);
        return { ok: true, data: created, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Unable to send connection request.")
        };
      }
    } catch {
      // Fall back to local
    }
  }

  if (me.role !== "patient" && me.role !== "caretaker") {
    return { ok: false, error: "Only patients and caregivers can send connection requests." };
  }

  const qLower = cleanTarget.toLowerCase();
  const target = getAllKnownDirectoryUsers().find(
    (entry) =>
      entry.userId.toLowerCase() === qLower ||
      entry.entityId.toLowerCase() === qLower ||
      entry.inviteCode.toLowerCase() === qLower
  );

  if (!target) {
    return { ok: false, error: `No user found with ID or invitation code '${cleanTarget}'.` };
  }
  if (target.userId === me.id) {
    return { ok: false, error: "You cannot send a connection request to yourself." };
  }
  if (target.role === me.role) {
    return {
      ok: false,
      error: `Connections can only be formed between a patient and a caregiver, not two ${me.role}s.`
    };
  }

  const patientId = me.role === "patient" ? me.patientId : target.entityId;
  const caregiverId = me.role === "caretaker" ? me.caretakerId : target.entityId;
  if (!patientId || !caregiverId) {
    return { ok: false, error: "Both patient and caregiver profiles must exist to connect." };
  }

  const alreadyConnected = getRelationships().some(
    (r) => r.patientId === patientId && r.caregiverId === caregiverId && r.status === "ACTIVE"
  );
  if (alreadyConnected) {
    return { ok: false, error: "These accounts are already connected." };
  }

  const requests = getConnectionRequests();
  const dup = requests.find(
    (r) =>
      r.status === "PENDING" &&
      ((r.senderId === me.id && r.receiverId === target.userId) ||
        (r.senderId === target.userId && r.receiverId === me.id))
  );
  if (dup) {
    return {
      ok: false,
      error:
        dup.senderId === me.id
          ? "A pending request to this user already exists."
          : "This user has already sent you a pending request. Check your incoming requests."
    };
  }

  const now = new Date().toISOString();
  const newReq: ConnectionRequest = {
    id: `creq-${Date.now()}`,
    senderId: me.id,
    receiverId: target.userId,
    senderRole: me.role,
    receiverRole: target.role,
    senderName: me.name,
    receiverName: target.name,
    senderInviteCode: me.inviteCode,
    receiverInviteCode: target.inviteCode,
    patientId,
    caregiverId,
    message: message?.trim() || undefined,
    status: "PENDING",
    createdAt: now,
    updatedAt: now
  };
  upsertRequestInLocal(newReq);
  return { ok: true, data: newReq };
}

export async function fetchIncomingRequests(currentUser: User): Promise<ConnectionRequest[]> {
  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/incoming`, {
        headers: buildHeaders(false)
      });
      if (res.ok) {
        const list: ConnectionRequest[] = await res.json();
        const others = getConnectionRequests().filter((r) => r.receiverId !== me.id);
        saveConnectionRequests([...list, ...others]);
        return list;
      }
    } catch {
      // Fallback
    }
  }

  return getConnectionRequests()
    .filter((r) => r.receiverId === me.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function fetchOutgoingRequests(currentUser: User): Promise<ConnectionRequest[]> {
  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/outgoing`, {
        headers: buildHeaders(false)
      });
      if (res.ok) {
        const list: ConnectionRequest[] = await res.json();
        const others = getConnectionRequests().filter((r) => r.senderId !== me.id);
        saveConnectionRequests([...list, ...others]);
        return list;
      }
    } catch {
      // Fallback
    }
  }

  return getConnectionRequests()
    .filter((r) => r.senderId === me.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function acceptConnectionRequest(
  currentUser: User,
  requestId: string
): Promise<ApiActionResult<{ request: ConnectionRequest; relationship: PatientCaregiverRelationship }>> {
  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(requestId)}/accept`, {
        method: "POST",
        headers: buildHeaders(true)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.request) upsertRequestInLocal(data.request);
        if (data?.relationship) {
          syncRelationshipToEntities(
            data.relationship.patientId,
            data.relationship.caregiverId,
            "connect"
          );
        }
        return { ok: true, data, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Unable to accept request.")
        };
      }
    } catch {
      // Fallback
    }
  }

  const all = getConnectionRequests();
  const target = all.find((r) => r.id === requestId);
  if (!target) return { ok: false, error: "Connection request not found." };
  if (target.receiverId !== me.id) {
    return { ok: false, error: "Only the receiving user can accept this request." };
  }
  if (target.status !== "PENDING") {
    return { ok: false, error: `Cannot accept a request with status '${target.status}'.` };
  }

  const updatedReq: ConnectionRequest = {
    ...target,
    status: "ACCEPTED",
    updatedAt: new Date().toISOString()
  };
  upsertRequestInLocal(updatedReq);
  const rel = syncRelationshipToEntities(target.patientId!, target.caregiverId!, "connect")!;
  return { ok: true, data: { request: updatedReq, relationship: rel } };
}

export async function rejectConnectionRequest(
  currentUser: User,
  requestId: string
): Promise<ApiActionResult<ConnectionRequest>> {
  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(requestId)}/reject`, {
        method: "POST",
        headers: buildHeaders(true)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.request) upsertRequestInLocal(data.request);
        return { ok: true, data: data.request, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Unable to reject request.")
        };
      }
    } catch {
      // Fallback
    }
  }

  const target = getConnectionRequests().find((r) => r.id === requestId);
  if (!target) return { ok: false, error: "Connection request not found." };
  if (target.receiverId !== me.id) {
    return { ok: false, error: "Only the receiving user can reject this request." };
  }
  if (target.status !== "PENDING") {
    return { ok: false, error: `Cannot reject a request with status '${target.status}'.` };
  }

  const updatedReq: ConnectionRequest = {
    ...target,
    status: "REJECTED",
    updatedAt: new Date().toISOString()
  };
  upsertRequestInLocal(updatedReq);
  return { ok: true, data: updatedReq };
}

export async function cancelConnectionRequest(
  currentUser: User,
  requestId: string
): Promise<ApiActionResult<ConnectionRequest>> {
  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(requestId)}/cancel`, {
        method: "POST",
        headers: buildHeaders(true)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.request) upsertRequestInLocal(data.request);
        return { ok: true, data: data.request, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Unable to cancel request.")
        };
      }
    } catch {
      // Fallback
    }
  }

  const target = getConnectionRequests().find((r) => r.id === requestId);
  if (!target) return { ok: false, error: "Connection request not found." };
  if (target.senderId !== me.id) {
    return { ok: false, error: "Only the sender can cancel this request." };
  }
  if (target.status !== "PENDING") {
    return { ok: false, error: `Cannot cancel a request with status '${target.status}'.` };
  }

  const updatedReq: ConnectionRequest = {
    ...target,
    status: "CANCELLED",
    updatedAt: new Date().toISOString()
  };
  upsertRequestInLocal(updatedReq);
  return { ok: true, data: updatedReq };
}

export async function fetchConnectedPatients(currentUser: User): Promise<ConnectedPatientSummary[]> {
  const me = resolveUserIdentity(currentUser);
  if (!me.caretakerId) return [];
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/patients`, {
        headers: buildHeaders(false)
      });
      if (res.ok) {
        const list: ConnectedPatientSummary[] = await res.json();
        // Sync patients and active relationships into localStorage
        const existingPatients = getPatients();
        list.forEach((item) => {
          const localMatch = existingPatients.find((p) => p.id === item.patient.id);
          if (!localMatch) {
            updatePatient(normalizePatientRecord(item.patient));
          }
          syncRelationshipToEntities(item.patient.id, me.caretakerId!, "connect");
        });
        // Mark any previously active relationship for this caregiver not in server active list as disconnected
        const serverActiveIds = new Set(list.map((i) => i.patient.id));
        getRelationships()
          .filter((r) => r.caregiverId === me.caretakerId && r.status === "ACTIVE" && !serverActiveIds.has(r.patientId))
          .forEach((r) => syncRelationshipToEntities(r.patientId, me.caretakerId!, "disconnect"));

        return getConnectedPatientSummariesForCaregiver(me.caretakerId);
      }
    } catch {
      // Fallback
    }
  }

  return getConnectedPatientSummariesForCaregiver(me.caretakerId);
}

export async function fetchConnectedCaregivers(currentUser: User): Promise<ConnectedCaregiverSummary[]> {
  const me = resolveUserIdentity(currentUser);
  if (!me.patientId) return [];
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/caregivers`, {
        headers: buildHeaders(false)
      });
      if (res.ok) {
        const list: ConnectedCaregiverSummary[] = await res.json();
        const existingCaretakers = getCaretakers();
        list.forEach((item) => {
          if (!existingCaretakers.some((c) => c.id === item.caregiver.id)) {
            saveCaretaker(item.caregiver as Caretaker);
          }
          syncRelationshipToEntities(me.patientId!, item.caregiver.id, "connect");
        });
        const serverActiveCgIds = new Set(list.map((i) => i.caregiver.id));
        getRelationships()
          .filter((r) => r.patientId === me.patientId && r.status === "ACTIVE" && !serverActiveCgIds.has(r.caregiverId))
          .forEach((r) => syncRelationshipToEntities(me.patientId!, r.caregiverId, "disconnect"));

        return getConnectedCaregiversForPatient(me.patientId);
      }
    } catch {
      // Fallback
    }
  }

  return getConnectedCaregiversForPatient(me.patientId);
}

export async function disconnectRelationship(
  currentUser: User,
  relationshipId: string,
  patientId: string,
  caregiverId: string
): Promise<ApiActionResult<PatientCaregiverRelationship>> {
  const me = resolveUserIdentity(currentUser);
  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(relationshipId)}`, {
        method: "DELETE",
        headers: buildHeaders(false)
      });
      if (res.ok) {
        const data = await res.json();
        syncRelationshipToEntities(patientId, caregiverId, "disconnect");
        return { ok: true, data: data.relationship, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Unable to disconnect.")
        };
      }
    } catch {
      // Fallback
    }
  }

  const rel = syncRelationshipToEntities(patientId, caregiverId, "disconnect");
  if (!rel) return { ok: false, error: "Connection not found." };
  return { ok: true, data: rel };
}

// --- Shared Reminder Management API ---
export async function fetchPatientReminders(
  currentUser: User | null,
  patientId: string
): Promise<Reminder[]> {
  if (!patientId) return [];
  if (currentUser) {
    const me = resolveUserIdentity(currentUser);
    await ensureBackendSession(me);
    if (sessionToken) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/reminders?patientId=${encodeURIComponent(patientId)}`,
          { headers: buildHeaders(false) }
        );
        if (res.ok) {
          const serverList: Reminder[] = await res.json();
          const normalized = serverList.map(normalizeReminderRecord);
          // For patient role, preserve any inactive reminders stored locally for caregiver view
          if (me.role === "patient") {
            const existingInactive = getReminders(patientId).filter((r) => r.isActive === false);
            const merged = [...normalized, ...existingInactive.filter((e) => !normalized.some((n) => n.id === e.id))];
            replacePatientReminders(patientId, merged);
            return normalized;
          }
          replacePatientReminders(patientId, normalized);
          return normalized;
        }
      } catch {
        // Fallback to local
      }
    }
  }

  const local = getReminders(patientId);
  if (currentUser?.role === "patient") {
    return local.filter((r) => r.isActive !== false);
  }
  return local;
}

export interface CreateReminderPayload {
  patientId: string;
  title: string;
  description?: string;
  category: ReminderCategory;
  scheduledDate: string;
  scheduledTime: string;
  repeatFrequency: RepeatFrequency;
  customRepeatNote?: string;
  isActive?: boolean;
  dosage?: string;
}

export async function createReminderApi(
  currentUser: User,
  payload: CreateReminderPayload
): Promise<ApiActionResult<Reminder>> {
  const me = resolveUserIdentity(currentUser);
  if (me.role !== "caretaker" && me.role !== "doctor") {
    return { ok: false, status: 403, error: "Only caregivers or doctors can create reminders." };
  }

  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/reminders`, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created: Reminder = normalizeReminderRecord(await res.json());
        saveReminder(created);
        return { ok: true, data: created, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Could not create reminder.")
        };
      }
    } catch {
      // Fallback
    }
  }

  const now = new Date().toISOString();
  const created = saveReminder({
    id: `rem-${Date.now()}`,
    patientId: payload.patientId,
    type: categoryToReminderType(payload.category),
    category: payload.category,
    title: payload.title.trim(),
    description: payload.description?.trim() || "",
    notes: payload.description?.trim() || "",
    instructions: payload.description?.trim() || undefined,
    dosage: payload.dosage?.trim() || undefined,
    time: payload.scheduledTime,
    scheduledTime: payload.scheduledTime,
    scheduledDate: payload.scheduledDate,
    repeatFrequency: payload.repeatFrequency,
    customRepeatNote: payload.customRepeatNote?.trim() || undefined,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    status: "upcoming",
    createdBy: me.caretakerId || me.doctorId || me.id,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  });

  return { ok: true, data: created };
}

export async function updateReminderApi(
  currentUser: User,
  reminderId: string,
  updates: Partial<{
    title: string;
    description: string;
    category: ReminderCategory;
    scheduledDate: string;
    scheduledTime: string;
    repeatFrequency: RepeatFrequency;
    customRepeatNote: string;
    isActive: boolean;
    dosage: string;
    status: ReminderStatus;
  }>
): Promise<ApiActionResult<Reminder>> {
  const me = resolveUserIdentity(currentUser);
  if (me.role !== "caretaker" && me.role !== "doctor") {
    return { ok: false, status: 403, error: "Patients cannot edit caregiver-created reminders." };
  }

  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/reminders/${encodeURIComponent(reminderId)}`, {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated: Reminder = normalizeReminderRecord(await res.json());
        saveReminder(updated);
        return { ok: true, data: updated, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Could not update reminder.")
        };
      }
    } catch {
      // Fallback
    }
  }

  const existing = getReminders().find((r) => r.id === reminderId);
  if (!existing) return { ok: false, error: "Reminder not found." };

  const nextCategory = updates.category || existing.category || "Custom Reminder";
  const saved = saveReminder({
    ...existing,
    ...updates,
    category: nextCategory,
    type: categoryToReminderType(nextCategory),
    time: updates.scheduledTime ?? existing.scheduledTime ?? existing.time,
    scheduledTime: updates.scheduledTime ?? existing.scheduledTime ?? existing.time,
    notes: updates.description !== undefined ? updates.description : existing.notes,
    instructions: updates.description !== undefined ? updates.description : existing.instructions
  });
  return { ok: true, data: saved };
}

export async function deleteReminderApi(
  currentUser: User,
  reminderId: string
): Promise<ApiActionResult<{ id: string }>> {
  const me = resolveUserIdentity(currentUser);
  if (me.role !== "caretaker" && me.role !== "doctor") {
    return { ok: false, status: 403, error: "Patients cannot delete reminders." };
  }

  await ensureBackendSession(me);

  if (sessionToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/reminders/${encodeURIComponent(reminderId)}`, {
        method: "DELETE",
        headers: buildHeaders(false)
      });
      if (res.ok) {
        deleteReminder(reminderId);
        return { ok: true, data: { id: reminderId }, fromBackend: true };
      }
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: await parseErrorDetail(res, "Could not delete reminder.")
        };
      }
    } catch {
      // Fallback
    }
  }

  deleteReminder(reminderId);
  return { ok: true, data: { id: reminderId } };
}

export async function completeReminderApi(
  currentUser: User | null,
  reminderId: string,
  status: ReminderStatus = "completed",
  options?: { snoozedUntil?: string }
): Promise<ApiActionResult<Reminder>> {
  if (currentUser) {
    const me = resolveUserIdentity(currentUser);
    await ensureBackendSession(me);

    if (sessionToken) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/reminders/${encodeURIComponent(reminderId)}/complete`,
          {
            method: "PATCH",
            headers: buildHeaders(true),
            body: JSON.stringify({ status, snoozedUntil: options?.snoozedUntil })
          }
        );
        if (res.ok) {
          const updated = normalizeReminderRecord(await res.json());
          saveReminder(updated);
          return { ok: true, data: updated, fromBackend: true };
        }
        if (res.status >= 400 && res.status < 500) {
          return {
            ok: false,
            status: res.status,
            error: await parseErrorDetail(res, "Could not update reminder status.")
          };
        }
      } catch {
        // Fallback
      }
    }
  }

  const updated = updateReminderStatus(reminderId, status, options);
  if (!updated) return { ok: false, error: "Reminder not found." };
  return { ok: true, data: updated };
}
