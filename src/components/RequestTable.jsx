import React, { useMemo } from "react";

export default function RequestTable({
  rows = [],
  status, setStatus,
  query, setQuery,
  dept, setDept,
  categories = [],
  onSelect,
}) {
  const tabDefs = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "denied",   label: "Denied" },   // UI word; backend uses "rejected"
    { key: "all",      label: "All" },
  ];

  const deptOptions = useMemo(() => ["all", ...categories], [categories]);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="rt">
      {/* controls */}
      <div className="rt-toolbar">
        <div className="rt-tabs">
          {tabDefs.map(t => (
            <button
              key={t.key}
              type="button"
              className={`btn rt-tab ${status === t.key ? "is-active" : ""}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          className="rt-search"
          type="search"
          placeholder="Search title, company, email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="rt-select"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          {deptOptions.map((d) => (
            <option key={d} value={d}>
              {d === "all" ? "All departments" : d}
            </option>
          ))}
        </select>
      </div>

      {/* table */}
      <div className="rt-tablewrap">
        <table className="rt-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Title</th>
              <th>Company</th>
              <th>Department(s)</th>
              <th className="rt-center">Status</th>
              <th className="rt-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{fmtDate(r.created_at || r.start_iso || r.date)}</td>
                <td>
                  <div className="rt-title">{r.title || "—"}</div>
                </td>
                <td>
                  <div className="rt-company">
                    {r.organization || "—"}
                    {r.email ? <span className="rt-muted"> {r.email}</span> : null}
                  </div>
                </td>
                <td>
                  {Array.isArray(r.departments) && r.departments.length > 0
                    ? r.departments.map((d, i) => (
                        <span key={`${r.id}-${i}`} className="tag">{d}</span>
                      ))
                    : "—"}
                </td>
                <td className="rt-center">
                  <span className={`status status--${r.status}`}>{r.status}</span>
                </td>
                <td className="rt-right">
                  <button type="button" className="btn" onClick={() => onSelect(r)}>View</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="rt-empty">No requests.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
