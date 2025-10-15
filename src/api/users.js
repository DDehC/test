const API = "/api";

async function parseJson(res) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : {};
}
function ensureOk(res, body) {
  if (!res.ok) throw new Error(body?.message || body?.error || "Request failed");
}

export const usersApi = {
  async list({ search, role, active, page = 1, page_size = 100 } = {}) {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (role) qs.set("role", role);
    if (active !== undefined) qs.set("active", active ? "1" : "0");
    qs.set("page", String(page));
    qs.set("page_size", String(page_size));

    const res = await fetch(`${API}/admin/users?${qs.toString()}`, {
      method: "GET",
      credentials: "include",        // send session cookie
      // no headers: avoid preflight
    });
    const body = await parseJson(res);
    ensureOk(res, body);
    return body;
  },

  async create(data) {
    const res = await fetch(`${API}/admin/users`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }, // preflight is OK now
      body: JSON.stringify(data),
    });
    const body = await parseJson(res);
    ensureOk(res, body);
    return body;
  },

  async update(user_id, data) {
    const res = await fetch(`${API}/admin/users/${encodeURIComponent(user_id)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await parseJson(res);
    ensureOk(res, body);
    return body;
  },

  async remove(user_id) {
    const res = await fetch(`${API}/admin/users/${encodeURIComponent(user_id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const body = await parseJson(res);
    ensureOk(res, body);
    return body;
  },
};
