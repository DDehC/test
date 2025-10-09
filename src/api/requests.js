// frontend/src/api/requests.js
const API = "/api";

async function parseJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { error: { code: "NON_JSON", message: text } };
}

/* ---------- CREATE (multipart) ---------- */
export async function publicationRequest(payload, files = []) {
  const fd = new FormData();
  (files || []).forEach((f) => fd.append("attachments", f));

  const entries = {
    title: payload.title ?? "",
    author: payload.author ?? "",
    organization: payload.organization ?? "",
    email: payload.email ?? "",
    location: payload.location ?? "",
    on_campus: payload.on_campus ? "true" : "false",
    max_attendees:
      payload.max_attendees == null ? "" : String(payload.max_attendees),
    date: payload.date ?? "",
    start_time: payload.start_time ?? "",
    end_time: payload.end_time ?? "",
    description: payload.description ?? "",
    publish_all: payload.publish_all ? "true" : "false",
  };
  Object.entries(entries).forEach(([k, v]) => fd.append(k, v));

  const departments = Array.isArray(payload.departments) ? payload.departments : [];
  fd.append("departments", JSON.stringify(departments));

  const res = await fetch(`${API}/req/pubreqtest`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  return parseJson(res);
}

/* ---------- LIST ---------- */
async function list(params = {}) {
  const q = new URLSearchParams();
  if (params.dept && params.dept !== "all") q.set("dept", params.dept);
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.q) q.set("q", params.q);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));

  const res = await fetch(`${API}/req/pubreqfetch?${q.toString()}`, {
    credentials: "include",
  });
  if (res.status === 403) throw new Error("forbidden");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.items)) throw new Error("Unexpected response shape");
  return data;
}

/* ---------- UPDATE STATUS ---------- */
async function update(id, payload = {}) {
  const res = await fetch(`${API}/req/pubreqchangestatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, ...payload }),
  });
  if (res.status === 403) throw new Error("forbidden");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "Update failed");
  return body;
}

/* ---------- DELETE (NEW) ---------- */
async function remove(id) {
  // Backend endpoint name aligned with existing naming scheme
  const res = await fetch(`${API}/req/pubreqdelete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id }),
  });
  if (res.status === 403) throw new Error("forbidden");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "Delete failed");
  return body;
}

/* ---------- Back-compat helper ---------- */
export async function publicationRequestFetch() {
  const res = await fetch(`${API}/req/pubreqfetch`, {
    method: "GET",
    credentials: "include",
  });
  return parseJson(res);
}

export const requestsApi = { list, update, remove };
