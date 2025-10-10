import React, { useState, useEffect } from "react";
import { categories } from "./DepartmentList.js";
import { updateRequest } from "../api/requests";

export default function RequestDrawer({
  current,
  feedback,
  setFeedback,
  onClose,
  onApprove,
  onDeny,
  onDelete,
  onSave,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(current ?? {});

  useEffect(() => {
    if (current) setFormData({ ...current, id: current.id || current._id });
    else setFormData({});
  }, [current]);

  if (!current) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDept = (dept) => {
    const currentDepts = formData.departments || [];
    const updated = currentDepts.includes(dept)
      ? currentDepts.filter((d) => d !== dept)
      : [...currentDepts, dept];
    handleChange("departments", updated);
  };
  
 const handleSave = async () => {
  try {
    const updated = await updateRequest(formData);
    setFormData(updated);
    setIsEditing(false);
  } catch (err) {
    alert(err.message);
  }
};

  const sendEmail = async () => {
    if (!feedback) return;
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: current.email,
          subject: `Your request "${current.title}" has been ${current.status}`,
          body: feedback,
        }),
      });
      if (!res.ok) throw new Error("Failed to send email");
      alert("Email sent!");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Error sending email");
    }
  };

  const confirmDelete = () => {
    if (window.confirm("Are you sure you want to delete this request? This cannot be undone.")) {
      onDelete(current);
    }
  };

  const shownDepartments = isEditing
    ? categories
    : formData.departments?.length
    ? formData.departments
    : [];

  return (
    <div className="rd-overlay" role="dialog" aria-modal="true">
      <aside className="rd-sheet">
        <header className="rd-head">
          {isEditing ? (
            <input
              className="rd-input rd-title-input"
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Title"
            />
          ) : (
            <h2 className="rd-title">{formData.title || "Request"}</h2>
          )}
          <button className="rd-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="rd-body">
          <div className="rd-meta">
            <div>
              <span className="k">Author</span>
              <input
                className="rd-input"
                value={formData.author || ""}
                onChange={(e) => handleChange("author", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Organization</span>
              <input
                className="rd-input"
                value={formData.organization || ""}
                onChange={(e) => handleChange("organization", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Email</span>
              <input
                className="rd-input"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Location</span>
              <input
                className="rd-input"
                value={formData.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Date</span>
              <input
                className="rd-input"
                type="date"
                value={formData.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Start Time</span>
              <input
                className="rd-input"
                type="time"
                value={formData.start_time || ""}
                onChange={(e) => handleChange("start_time", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">End Time</span>
              <input
                className="rd-input"
                type="time"
                value={formData.end_time || ""}
                onChange={(e) => handleChange("end_time", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Max Attendees</span>
              <input
                className="rd-input"
                type="number"
                min="1"
                value={formData.max_attendees || ""}
                onChange={(e) => handleChange("max_attendees", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <span className="k">Status</span>
              <span className={`v pill status--${formData.status}`}>{formData.status}</span>
            </div>
          </div>

          {/* Departments */}
          <div className="rd-block">
            <div className="k">Departments</div>
            <div className="chips">
              {shownDepartments.length > 0 ? (
                shownDepartments.map((dept) => {
                  const selected = formData.departments?.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      className={`chip ${selected ? "selected" : ""}`}
                      onClick={() => isEditing && toggleDept(dept)}
                      disabled={!isEditing}
                    >
                      {dept}
                    </button>
                  );
                })
              ) : (
                <div className="muted">No departments selected</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rd-block">
            <div className="k">Description</div>
            <textarea
              className="rd-textarea"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          {/* Attachments */}
          {formData.attachments?.length > 0 && (
            <div className="rd-block">
              <div className="k">Attachments</div>
              <ul className="files">
                {formData.attachments.map((a, i) => (
                  <li key={i}>
                    <a
                      className="link"
                      href={a.url || a.path || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {a.filename || a.name || "file"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          <div className="rd-block">
            <div className="k">Feedback</div>
            <textarea
              className="rd-textarea"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional message to requester"
            />
          </div>
        </section>

        <footer className="rd-actions">
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
          <div className="spacer" />
          <button className="btn btn--lightdanger" onClick={confirmDelete}>Delete</button>
          {isEditing ? (
            <button className="btn btn--submit" onClick={handleSave}>Save</button>
          ) : (
            <button className="btn btn--ghost" onClick={() => setIsEditing(true)}>Edit</button>
          )}
          <button className="btn" onClick={() => onApprove(formData.id, feedback)}>Approve</button>
          <button className="btn btn--danger" onClick={() => onDeny(formData.id, feedback)}>Deny</button>
          <button className="btn btn--ghost" onClick={sendEmail}>Send</button>
        </footer>
      </aside>

      <style>{`
        .rd-overlay{
          --rd-accent:#FDC700;
          position:fixed;
          inset:0;
          background:rgba(2,6,23,.48);
          display:grid;
          place-items:center;
          z-index:70;
          padding-top:80px;
        }
        .rd-sheet{
          width:min(760px,95vw);
          max-height:90vh;
          overflow:auto;
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:16px;
          box-shadow:0 24px 64px rgba(15,23,42,.2);
        }
        .rd-head{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0}
        .rd-title{margin:0;font-size:22px;font-weight:800}
        .rd-title-input{font-size:18px;font-weight:700;}
        .rd-x{margin-left:auto;border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer}
        .rd-body{padding:14px 16px}
        .rd-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 20px;margin-bottom:12px}
        @media (max-width:820px){.rd-meta{grid-template-columns:1fr 1fr}}
        @media (max-width:580px){.rd-meta{grid-template-columns:1fr}}
        .rd-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:14px;}
        .rd-block{margin-top:10px}
        .k{font-size:12px;color:#64748b}
        .v{display:block;font-size:14px;color:#0f172a}
        .pill{display:inline-block;padding:4px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#e5e7eb}
        .status--approved{background:#dcfce7 !important;color:#166534 !important;border-color:#86efac !important}
        .status--denied{background:#fee2e2 !important;color:#991b1b !important;border-color:#fca5a5 !important}
        .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
        .chip{border:1px solid #e2e8f0;border-radius:999px;padding:6px 10px;font-size:12px;background:#fff;cursor:pointer;user-select:none;}
        .chip.selected{background:#FDC700;color:#1f2937;border-color:#FDC700;font-weight:600;}
        .desc{white-space:pre-wrap}
        .files{margin:6px 0 0;padding-left:18px}
        .rd-textarea{width:100%;min-height:90px;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:14px;outline:none;}
        .rd-textarea:focus{border-color:var(--rd-accent);box-shadow:0 0 0 3px #FFF7CC}
        .rd-actions{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;border-bottom-left-radius:16px;border-bottom-right-radius:16px}
        .btn{appearance:none;border:1px solid var(--rd-accent);background:var(--rd-accent);color:#1f2937;font-weight:700;padding:10px 14px;border-radius:12px;cursor:pointer}
        .btn--ghost{background:transparent;color:#1f2937;border-color:var(--rd-accent)}
        .btn--danger{background:#ef4444;border-color:#ef4444;color:#fff}
        .btn--lightdanger{background:#fff;color:#ef4444;border-color:#ef4444}
        .btn--submit{background:var(--rd-accent);border-color:var(--rd-accent);color:#1f2937}
        .spacer{flex:1}
        .link{color:#2563eb;text-decoration:none;font-weight:500;}
        .link:hover{text-decoration:underline;}
        .muted{color:#64748b;font-size:12px;}
      `}</style>
    </div>
  );
}

