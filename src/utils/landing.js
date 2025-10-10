// frontend/src/utils/landing.js

// Canonical landing path for each role.
export const ROLE_LANDING = {
  student: "/student",
  staff:   "/staff",
  admin:   "/admin",
};

// Read role from localStorage. Returns "guest" if unset.
export function getRole() {
  try {
    const r = localStorage.getItem("role") || "";
    if (!r) return "guest";
    // normalize publisher→staff to match backend normalize_role
    if (r === "publisher") return "staff";
    if (["student", "staff", "admin"].includes(r)) return r;
    return "guest";
  } catch {
    return "guest";
  }
}

// Persist role to localStorage in canonical form.
export function setRole(role) {
  const t = (role || "").toLowerCase();
  const norm =
    t === "publisher" ? "staff" :
    (["student", "staff", "admin"].includes(t) ? t : "guest");
  try { localStorage.setItem("role", norm); } catch {}
  return norm;
}

// Clear role (e.g., on logout).
export function clearRole() {
  try { localStorage.removeItem("role"); } catch {}
}

// Optional: mark that we navigated to landing, useful for analytics/UX.
export function markLanding(path) {
  try { localStorage.setItem("lastLanding", path || ""); } catch {}
}
