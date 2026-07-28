// Fetch client: attaches the JWT, refreshes it once on 401, and surfaces
// API errors as ApiError so screens can react to a code, not a string match.
const BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Field-level messages from marshmallow, keyed by field name. */
  fields?: Record<string, string[]>;
  /** Reviewer-facing reasons, e.g. why a minor cannot be approved yet. */
  blockers?: string[];

  constructor(
    message: string,
    status: number,
    extra: { code?: string; fields?: Record<string, string[]>; blockers?: string[] } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = extra.code;
    this.fields = extra.fields;
    this.blockers = extra.blockers;
  }
}

export function getToken() {
  return localStorage.getItem("access");
}

function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.dispatchEvent(new CustomEvent("iga:session-expired"));
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh");
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.access) return false;
    localStorage.setItem("access", data.access);
    return true;
  } catch {
    return false;
  }
}

export async function api(path: string, options: RequestInit = {}, isRetry = false): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (res.status === 401 && !isRetry && !path.startsWith("/auth/")) {
    if (await refreshAccessToken()) return api(path, options, true);
    clearSession();
  }

  if (res.status === 204) return {};

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (res.ok) return res;
    throw new ApiError("The server returned an unexpected response.", res.status);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const fields = data.errors && typeof data.errors === "object" ? data.errors : undefined;
    const message =
      data.error ??
      (fields ? Object.values(fields as Record<string, string[]>)[0]?.[0] : undefined) ??
      "Something went wrong. Try again.";
    throw new ApiError(message, res.status, { code: data.code, fields, blockers: data.blockers });
  }

  return data;
}

/** Resolves a document to a viewable URL. */
export async function apiFileUrl(path: string): Promise<{ url: string; revoke: boolean }> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError("That document could not be opened.", res.status);

  if ((res.headers.get("content-type") ?? "").includes("application/json")) {
    const data = await res.json();
    return { url: data.url, revoke: false };
  }
  return { url: URL.createObjectURL(await res.blob()), revoke: true };
}


export type Role = "student" | "ambassador" | "donor" | "admin";
export type ProfileStatus = "draft" | "pending" | "approved" | "rejected";

export type User = {
  id: number;
  email: string;
  role: Role;
  full_name: string;
  is_suspended?: boolean;
  notify_email?: boolean;
  created_at?: string;
};

export type Institution = {
  id: number;
  name: string;
  location: string;
  type: string;
};

export type Profile = {
  id: number;
  status: ProfileStatus;
  bio: string;
  academic_level: string | null;
  field_of_study: string | null;
  funding_goal: number;
  funded_amount: number;
  institution: Institution | null;
  document_count: number;
  created_at: string | null;
  is_minor?: boolean;
  full_name: string | null;
  video_url?: string | null;
  photo_url?: string | null;
  // present only on non-public payloads
  user_id?: number;
  ambassador_id?: number | null;
  email?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_consent?: boolean;
  media_consent?: boolean;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  edit_request_reason?: string | null;
  has_guardian_consent_document?: boolean;
};

export type DocType = "id_card" | "transcript" | "recommendation" | "guardian_consent";

export type Doc = {
  id: number;
  profile_id: number;
  doc_type: DocType;
  original_filename: string;
  verified: boolean;
  uploaded_at: string | null;
};

export type NotificationItem = {
  id: number;
  type: "info" | "success" | "warning" | "action" | string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string | null;
};

export type ContributionItem = {
  id: number;
  donor_name: string;
  amount: number;
  currency: string;
  message: string | null;
  created_at: string | null;
  // withheld from bystanders by the API
  donor_id?: number | null;
  profile_id?: number;
  student_name?: string;
  receipt_ref?: string;
  proof_image_url?: string | null;
  ticket_number?: string | null;
  is_anonymous?: boolean;
  routed_to_institution?: boolean;
  institution?: Institution | null;
};

export type TicketItem = {
  id: number;
  ticket_number: string;
  user_id: number;
  user_name: string;
  process_type: string;
  title: string;
  summary: string;
  details: Record<string, any>;
  created_at: string | null;
};

export type AuditLogItem = {
  id: number;
  actor_id: number;
  action: string;
  target_type: string;
  target_id: number;
  note: string;
  created_at: string | null;
};

export type AdminStats = {
  total_profiles: number;
  pending: number;
  approved: number;
  rejected: number;
  total_users: number;
};


export const endpoints = {
  publicProfiles: (params?: { academic_level?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.academic_level && params.academic_level !== "all") {
      q.set("academic_level", params.academic_level);
    }
    if (params?.page) q.set("page", String(params.page));
    const qs = q.toString();
    return api(`/profiles/public${qs ? `?${qs}` : ""}`);
  },
  publicProfile: (id: number) => api(`/profiles/public/${id}`),
  myProfiles: () => api("/profiles/"),
  profile: (id: number) => api(`/profiles/${id}`),
  createProfile: (body: unknown) => api("/profiles/", { method: "POST", body: JSON.stringify(body) }),
  updateProfile: (id: number, body: unknown) =>
    api(`/profiles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  submitProfile: (id: number) => api(`/profiles/${id}/submit`, { method: "POST" }),
  requestEdit: (id: number, reason: string) =>
    api(`/profiles/${id}/request-edit`, { method: "POST", body: JSON.stringify({ reason }) }),

  documents: (profileId: number) => api(`/profiles/${profileId}/documents`),
  uploadDocument: (profileId: number, form: FormData) =>
    api(`/profiles/${profileId}/documents`, { method: "POST", body: form }),
  deleteDocument: (profileId: number, docId: number) =>
    api(`/profiles/${profileId}/documents/${docId}`, { method: "DELETE" }),
  documentFileUrl: (profileId: number, docId: number) =>
    `/profiles/${profileId}/documents/${docId}/file`,
  verifyDocument: (profileId: number, docId: number, verified: boolean) =>
    api(`/profiles/${profileId}/documents/${docId}/verify`, {
      method: "POST",
      body: JSON.stringify({ verified }),
    }),

  institutions: () => api("/institutions/"),
  createInstitution: (body: unknown) =>
    api("/institutions/", { method: "POST", body: JSON.stringify(body) }),

  contribute: (body: unknown) => api("/contributions/", { method: "POST", body: JSON.stringify(body) }),
  myContributions: () => api("/contributions/my"),
  profileContributions: (profileId: number) => api(`/contributions/profile/${profileId}`),

  me: () => api("/auth/me"),
  verifyPassword: (password: string) =>
    api("/auth/me", { method: "PUT", body: JSON.stringify({ current_password: password }) }),
  updateSettings: (payload: {
    full_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    notify_email?: boolean;
  }) => api("/auth/me", { method: "PUT", body: JSON.stringify(payload) }),
  notifications: () => api("/notifications/"),
  markNotificationRead: (id: number) => api(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => api("/notifications/read-all", { method: "POST" }),

  watchProfile: (id: number) => api(`/profiles/${id}/watch`, { method: "POST" }),
  unwatchProfile: (id: number) => api(`/profiles/${id}/watch`, { method: "DELETE" }),
  watchedProfiles: () => api("/profiles/watching"),

  // Tickets are the admin-facing process record — no other role can read them.
  adminTickets: () => api("/tickets/"),
  auditLogs: () => api("/audit/"),

  adminProfiles: (status: string) => api(`/admin/profiles?status=${status}`),
  adminProfile: (id: number) => api(`/admin/profiles/${id}`),
  approveProfile: (id: number, note: string) =>
    api(`/admin/profiles/${id}/approve`, { method: "POST", body: JSON.stringify({ note }) }),
  rejectProfile: (id: number, note: string) =>
    api(`/admin/profiles/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  promoteAmbassador: (userId: number) =>
    api(`/admin/users/${userId}/promote-ambassador`, { method: "POST" }),
  adminStats: () => api("/admin/stats"),
  adminUsers: (role = "all", search = "", page = 1) =>
    api(`/admin/users?role=${role}&search=${encodeURIComponent(search)}&page=${page}`),
  changeUserRole: (userId: number, role: Role) =>
    api(`/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  suspendUser: (userId: number, note: string) =>
    api(`/admin/users/${userId}/suspend`, { method: "POST", body: JSON.stringify({ note }) }),
};
