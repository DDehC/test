const API = "/api";

export async function fetchCalendar(startYYYYMMDD, endYYYYMMDD) {
  const q = new URLSearchParams({ start: startYYYYMMDD, end: endYYYYMMDD });
  const res = await fetch(`${API}/req/calendar?${q.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.items || [];
}
