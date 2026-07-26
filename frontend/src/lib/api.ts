// Minimal fetch wrapper that attaches the JWT and surfaces API errors.
const BASE = import.meta.env.VITE_API_URL ?? "/api";

export function getToken() {
  return localStorage.getItem("access");
}

export async function api(path: string, options: RequestInit = {}, isRetry = false): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (res.status === 401 && !isRetry && !path.startsWith("/auth/")) {
    const refreshToken = localStorage.getItem("refresh");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access) {
            localStorage.setItem("access", refreshData.access);
            return api(path, options, true);
          }
        }
      } catch (e) {
        // Refresh failed
      }
      localStorage.clear();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? (data.errors ? JSON.stringify(data.errors) : "Request failed"));
  return data;
}

// typed helpers for profiles
export type Profile = {
  id: number;
  user_id: number;
  status: "draft" | "pending" | "approved" | "rejected";
  bio: string;
  date_of_birth: string | null;
  phone: string | null;
  academic_level: string | null;
  field_of_study: string | null;
  funding_goal: number;
  funded_amount: number;
  institution: { id: number; name: string; location: string; type: string } | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_consent: boolean;
  video_url?: string | null;
  media_consent?: boolean;
  is_minor?: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  document_count: number;
  full_name: string | null;
  created_at: string | null;
};

export type Doc = {
  id: number;
  profile_id: number;
  doc_type: string;
  original_filename: string;
  verified: boolean;
  uploaded_at: string | null;
};

export type NotificationItem = {
  id: number;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string | null;
};

export type ContributionItem = {
  id: number;
  donor_id: number | null;
  donor_name: string;
  student_name?: string;
  profile_id: number;
  amount: number;
  currency: string;
  receipt_ref: string;
  proof_image_url?: string | null;
  ticket_number?: string | null;
  message: string | null;
  is_anonymous: boolean;
  routed_to_institution: boolean;
  created_at: string | null;
  institution?: { id: number; name: string; location: string; type: string } | null;
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
