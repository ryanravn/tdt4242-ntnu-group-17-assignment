// Helper: get auth headers
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// Generic JSON fetcher with auth
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Typed API methods
export const api = {
  // Logs
  createLog(data: { tool: string; taskTypes: string[]; assignmentId: number }) {
    return apiFetch<{ id: number; tool: string; taskTypes: string[]; assignmentId: number; createdAt: string }>("/api/logs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getLogs(params?: { assignment_id?: number; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.assignment_id) qs.set("assignment_id", String(params.assignment_id));
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const query = qs.toString();
    return apiFetch<{ id: number; tool: string; taskTypes: string[]; assignmentId: number; createdAt: string }[]>(`/api/logs${query ? `?${query}` : ""}`);
  },

  // Declarations
  createDeclaration(data: { assignmentId: number; declaredTools: string[] }) {
    return apiFetch<{ id: number; assignmentId: number; declaredTools: string[]; createdAt: string }>("/api/declarations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getDeclarations() {
    return apiFetch<{ id: number; assignmentId: number; declaredTools: string[]; createdAt: string }[]>("/api/declarations");
  },

  // Classifications
  getClassifications() {
    return apiFetch<{ id: number; studentId: number; assignmentId: number; riskLevel: string; undeclaredTools: string[] | null; declaredNotLogged: string[] | null; createdAt: string }[]>("/api/classifications");
  },

  // Alerts
  getAlerts() {
    return apiFetch<{ id: number; classificationId: number; studentId: number; assignmentId: number; riskLevel: string; createdAt: string }[]>("/api/alerts");
  },
};
