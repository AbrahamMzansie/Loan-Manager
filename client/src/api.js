import { queueRequest } from "./offline/sync";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Central fetch wrapper.
// - Adds the auth header and JSON content-type automatically.
// - GET requests are left to the browser/service-worker cache for offline
//   support (see vite.config.js runtimeCaching).
// - Mutating requests (POST/PUT/DELETE) that fail because the device is
//   offline are queued to IndexedDB and synced automatically once back
//   online (see offline/sync.js). The caller gets back { queued: true } so
//   the UI can show an optimistic "saved, will sync" state.
export async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  const url = `${API_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const payload = body !== undefined ? JSON.stringify(body) : undefined;

  try {
    const res = await fetch(url, { method, headers, body: payload });
    if (res.status === 401) {
      setToken(null);
      setStoredUser(null);
      window.location.hash = "#/login";
      throw new ApiError("Session expired, please log in again", 401);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    const isNetworkError = err instanceof TypeError; // fetch throws TypeError when offline
    if (isNetworkError && method !== "GET") {
      await queueRequest({ url, method, headers, body: payload });
      return { queued: true };
    }
    throw err;
  }
}

export const api = {
  login: (email, password) => apiFetch("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  registerFirstAdmin: (name, email, password) =>
    apiFetch("/auth/register-first-admin", { method: "POST", body: { name, email, password }, auth: false }),
  me: () => apiFetch("/auth/me"),
  listUsers: () => apiFetch("/auth/users"),
  createUser: (data) => apiFetch("/auth/users", { method: "POST", body: data }),

  listCustomers: (search) => apiFetch(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getCustomer: (id) => apiFetch(`/customers/${id}`),
  createCustomer: (data) => apiFetch("/customers", { method: "POST", body: data }),
  updateCustomer: (id, data) => apiFetch(`/customers/${id}`, { method: "PUT", body: data }),
  deleteCustomer: (id) => apiFetch(`/customers/${id}`, { method: "DELETE" }),

  listLoans: (status) => apiFetch(`/loans${status ? `?status=${status}` : ""}`),
  getLoan: (id) => apiFetch(`/loans/${id}`),
  createLoan: (data) => apiFetch("/loans", { method: "POST", body: data }),
  updateLoan: (id, data) => apiFetch(`/loans/${id}`, { method: "PUT", body: data }),
  recordPayment: (loanId, data) => apiFetch(`/loans/${loanId}/payments`, { method: "POST", body: data }),
  markPaid: (loanId) => apiFetch(`/loans/${loanId}/mark-paid`, { method: "POST" }),

  dashboard: () => apiFetch("/dashboard"),

  getSettings: () => apiFetch("/settings"),
  updateSettings: (data) => apiFetch("/settings", { method: "PUT", body: data }),
};

export { ApiError };
