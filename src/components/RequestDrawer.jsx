import React from "react";

export default function RequestDrawer({
  current,
  feedback, setFeedback,
  onClose,
  onApprove,
  onDeny,
  onDelete,
}) {
  if (!current) return null;

  const {
    id, title,
    organization, email, author,
    date, start_time, end_time,
    location, on_campus,
    max_attendees, status,
    departments = [], description = "", attachments = [],
  } = current;

  const confirmDelete = () => {
    if (window.confirm("Are you sure you want to delete this request? This cannot be undone.")) {
      onDelete(current);
    }
  };

  return (
    <div className="rd-overlay" role="dialog" aria-modal="true">
      <aside className="rd-sheet">
        <header className="rd-head">
          <h2 className="rd-title">{title || "Request"}</h2>
          <button className="rd-x" onClick={onClose} aria-label="Close">×</button>
        </header>

        <section className="rd-body">
          <div className="rd-meta">
            <div><span className="k">Organization</span><span className="v">{organization || "—"}</span></div>
            <div><span className="k">Email</span><span className="v">{email || "—"}</span></div>
            <div><span className="k">Contact</span><span className="v">{author || "—"}</span></div>

            <div><span className="k">Date</span><span className="v">{date || "—"}</span></div>
            <div><span className="k">Time</span><span className="v">{(start_time || "—") + " – " + (end_time || "—")}</span></div>
            <div><span className="k">Max attendees</span><span className="v">{(max_attendees ?? "—") === "" ? "—" : (max_attendees ?? "—")}</span></div>

            <div><span className="k">Location</span><span className="v">{on_campus ? "Campus" : (location || "—")}</span></div>
            <div><span className="k">Status</span><span className={`v pill status--${status}`}>{status}</span></div>
          </div>

          <div className="rd-block">
            <div className="k">Departments</div>
            <div className="chips">
              {(departments.length ? departments : ["—"]).map((d, i) => (
                <span key={i} className="chip tag">{d}</span>
              ))}
            </div>
          </div>

          <div className="rd-block">
            <div className="k">Description</div>
            <p className="desc">{description || "—"}</p>
          </div>

          {attachments?.length ? (
            <div className="rd-block">
              <div className="k">Attachments</div>
              <ul className="files">
                {attachments.map((a, i) => <li key={i}>{a.filename || a.name || "file"}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="rd-block">
            <div className="k">Feedback</div>
            <textarea
              className="rd-textarea"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional message to the requester"
            />
          </div>
        </section>

        <footer className="rd-actions">
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
          <div className="spacer" />
          <button className="btn btn--lightdanger" onClick={confirmDelete}>Delete</button>
          <button className="btn" onClick={() => onApprove(id, feedback)}>Approve</button>
          <button className="btn btn--danger" onClick={() => onDeny(id, feedback)}>Deny</button>
        </footer>
      </aside>

      <style>{`
        /* Scope everything to the drawer. No :root and no global .btn. */
        .rd-overlay{
          --rd-accent:#FDC700;
          position:fixed;inset:0;background:rgba(2,6,23,.48);display:grid;place-items:center;z-index:70
        }
        .rd-overlay .rd-sheet{width:min(760px,95vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 24px 64px rgba(15,23,42,.2)}
        .rd-overlay .rd-head{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0}
        .rd-overlay .rd-title{margin:0;font-size:22px;font-weight:800}
        .rd-overlay .rd-x{margin-left:auto;border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer}
        .rd-overlay .rd-body{padding:14px 16px}
        .rd-overlay .rd-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 20px;margin-bottom:12px}
        @media (max-width:820px){.rd-overlay .rd-meta{grid-template-columns:1fr 1fr}}
        @media (max-width:580px){.rd-overlay .rd-meta{grid-template-columns:1fr}}
        .rd-overlay .rd-block{margin-top:10px}
        .rd-overlay .k{font-size:12px;color:#64748b}
        .rd-overlay .v{display:block;font-size:14px;color:#0f172a}
        .rd-overlay .pill{display:inline-block;padding:4px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#e5e7eb}
        .rd-overlay .status--approved{background:#dcfce7 !important;color:#166534 !important;border-color:#86efac !important}
        .rd-overlay .status--denied{background:#fee2e2 !important;color:#991b1b !important;border-color:#fca5a5 !important}
        .rd-overlay .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
        .rd-overlay .chip{border:1px solid #e2e8f0;border-radius:999px;padding:6px 10px;font-size:12px;background:#fff}
        .rd-overlay .desc{white-space:pre-wrap}
        .rd-overlay .files{margin:6px 0 0;padding-left:18px}
        .rd-overlay .rd-textarea{width:100%;min-height:90px;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:14px;outline:none}
        .rd-overlay .rd-textarea:focus{border-color:var(--rd-accent);box-shadow:0 0 0 3px #FFF7CC}
        .rd-overlay .rd-actions{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;border-bottom-left-radius:16px;border-bottom-right-radius:16px}

        /* Buttons scoped to drawer */
        .rd-overlay .btn{appearance:none;border:1px solid var(--rd-accent);background:var(--rd-accent);color:#1f2937;font-weight:700;padding:10px 14px;border-radius:12px;cursor:pointer}
        .rd-overlay .btn--ghost{background:transparent;color:#1f2937;border-color:var(--rd-accent)}
        .rd-overlay .btn--danger{background:#ef4444;border-color:#ef4444;color:#fff}
        .rd-overlay .btn--lightdanger{background:#fff;color:#ef4444;border-color:#ef4444}
        .rd-overlay .spacer{flex:1}
      `}</style>
    </div>
  );
}
