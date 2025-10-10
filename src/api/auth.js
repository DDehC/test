// auth.js
// -------------------
// Handles authentication API calls (register, login, logout, session)
// Works with Nginx reverse proxy: relative URLs only, no direct backend hostname.
// -------------------

// Base URL: relative, so calls go through Nginx
const API = "/api";

// Helper: safely parse JSON responses
async function parseJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { error: { code: "NON_JSON", message: text } };
}

// Helper: throw error if response is not ok
function throwIfError(res, body) {
  if (!res.ok) {
    const msg = body?.error?.message || body?.message || res.statusText || "Request failed";
    const err = new Error(msg);
    err.code = body?.error?.code || `HTTP_${res.status}`;
    err.fieldErrors = body?.error?.fieldErrors;
    throw err;
  }
}

// -------------------
// Auth API functions
// -------------------

// Register a new user
export async function registerUser({ username, password, email, type, department }) {
  const res = await fetch('/auth/register', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, email, type, department }),
  });
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

// Log in an existing user
export async function loginUser({ username, email, password, remember }) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, email, password, remember }),
  });
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

// Log the user out
export async function logoutUser() {
  const res = await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    const body = await parseJson(res);
    throwIfError(res, body);
  }
}

// Get the current logged-in session (if any)
export async function getSession() {
  const res = await fetch(`${API}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401) return null;
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

// Change password
export async function changePassword({ current_password, new_password }) {
  const res = await fetch(`${API}/auth/change_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ current_password, new_password }),
  });
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

// Legacy admin-like routes
export async function createPublisher({ username, email, password, type, department }) {
  const res = await fetch(`${API}/auth/create_publisher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, email, password, type, department }),
  });
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

export async function deleteUser(username) {
  const res = await fetch(`${API}/auth/delete_user/${encodeURIComponent(username)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

export async function updateUser(username, data) {
  const res = await fetch(`${API}/auth/update_user/${encodeURIComponent(username)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const body = await parseJson(res);
  throwIfError(res, body);
  return body;
}

