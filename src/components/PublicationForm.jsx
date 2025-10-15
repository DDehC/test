import React, { useMemo, useRef, useState, useEffect } from "react";
import { categories } from "./DepartmentList.js";
import "../styles/PublicationForm.css";

export default function PublicationForm({
  title, setTitle,
  description, setDescription,
  author, setAuthor,
  email, setEmail,
  org, setOrg,
  location, setLocation,
  onCampus, setOnCampus,
  maxAttendees, setMaxAttendees,
  date, setDate,
  startTime, setStartTime,
  endTime, setEndTime,
  publishAll, setPublishAll,
  depts, setDepts,
  files, setFiles,
  onSubmit, onReset
}) {
  if (process.env.NODE_ENV !== "production") {
    const fns = { setMaxAttendees, setDate, setStartTime, setEndTime };
    for (const [k, v] of Object.entries(fns)) {
      if (typeof v !== "function") throw new Error(`${k} is not a function`);
    }
  }

  const vMax = maxAttendees == null ? "" : String(maxAttendees);
  const vDate = date || "";
  const vStart = startTime || "";
  const vEnd = endTime || "";

  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sentOpen, setSentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingEventRef = useRef(null);
  const TIME_LANG = "sv-SE"; // forces 24h UI in Chrome/Edge/Firefox
  
  const dateRef = useRef(null);
  useEffect(() => { if (publishAll && depts?.length) setDepts([]);}, [publishAll, depts?.length, setDepts]);

  // --- Drag & Drop state for Attachments ---
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // merge new files, de-dupe by name+size
  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    setFiles((prev = []) => {
      const key = (f) => `${f.name}|${f.size}`;
      const seen = new Set(prev.map(key));
      const merged = [...prev];
      for (const f of incoming) if (!seen.has(key(f))) merged.push(f);
      return merged;
    });
  };

  const onBrowse = (e) => addFiles(e.target.files);
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };
  const onDragEnter = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  // remove one / all files ------------- NEW
  const removeFileAt = (idx) =>
    setFiles((prev = []) => prev.filter((_, i) => i !== idx));
  const clearAllFiles = () => setFiles([]);
  // --------------------------------------

  const baseRequired = useMemo(
    () => new Set(["title", "author", "org", "email", "description", "date", "startTime", "endTime"]),
    []
  );

  const isFieldRequired = (name) => {
    if (name === "location") return !onCampus;
    if (name === "departments") return !publishAll;
    return baseRequired.has(name);
  };

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearForm = () => {
    setTitle?.(""); setDescription?.(""); setAuthor?.(""); setEmail?.(""); setOrg?.("");
    setLocation?.(""); setOnCampus?.(false); setMaxAttendees?.("");
    setDate?.(""); setStartTime?.(""); setEndTime?.("");
    setPublishAll?.(false); setDepts?.([]); setFiles?.([]);
  };

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "Please provide a title.";
    if (!author.trim()) nextErrors.author = "Please provide an author.";
    if (!org.trim()) nextErrors.org = "Please provide an organization.";
    if (!email.trim()) nextErrors.email = "Please provide an email address.";
    if (!description.trim()) nextErrors.description = "Please add a short description.";
    if (!vDate) nextErrors.date = "Please choose a date.";
    if (!vStart) nextErrors.startTime = "Please select a start time.";
    if (!vEnd) nextErrors.endTime = "Please select an end time.";
    if (!onCampus && !location.trim()) nextErrors.location = "Location is required when the event is not on campus.";
    if (vStart && vEnd && vStart >= vEnd) nextErrors.endTime = "End time must be later than the start time.";
    if (!publishAll && depts.length === 0) nextErrors.departments = "Select at least one department or publish to all.";
    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    e.persist?.();
    pendingEventRef.current = e;
    setConfirmOpen(true);
  };

  const handleReset = (e) => {
    onReset ? onReset(e) : clearForm();
    setErrors({});
    setConfirmOpen(false);
    pendingEventRef.current = null;
  };

  const finalizeSubmission = () => {
    setErrors({});
    onReset ? onReset() : clearForm();
  };

  const runSubmission = () => {
    const event = pendingEventRef.current;
    pendingEventRef.current = null;
    if (!event) return;

    setIsSubmitting(true);

    const finish = () => {
      finalizeSubmission();
      setIsSubmitting(false);
      setConfirmOpen(false);
      setSentOpen(true);
    };

    try {
      const maybe = onSubmit?.(event);
      if (maybe && typeof maybe.then === "function") maybe.finally(finish);
      else finish();
    } catch {
      finish();
    }
  };

  const dismissConfirm = () => { setConfirmOpen(false); pendingEventRef.current = null; };

  const renderLabel = (_name, text) => <span className="label">{text}</span>;
  const deptLabel = renderLabel("departments", "Departments");
  const renderError = (key) => (errors[key] ? <span className="error" role="alert">{errors[key]}</span> : null);

  const toggleDept = (dept) => {
    const exists = depts.includes(dept);
    const updated = exists ? depts.filter((d) => d !== dept) : [...depts, dept];
    setDepts(updated);
    if (updated.length > 0 || publishAll) clearError("departments");
  };

  const handleFiles = (e) => setFiles([...e.target.files]);

  const openPicker = (ref) => {
    const el = ref?.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") { el.showPicker(); return; }
    } catch {}
    el.focus({ preventScroll: true });
  };

  return (
    <form className="pub-form card" onSubmit={handleSubmit} onReset={handleReset} noValidate>
      <div className="card-head">
        <h2 className="title">Publication Request</h2>
        <p className="subtitle">Share your event details below and we&apos;ll guide you through a polished submission.</p>
      </div>

      {/* Title */}
      <div className="grid-1">
        <label className={`field ${errors.title ? "field--error" : ""}`}>
          {renderLabel("title", "Title")}
          <input
            className="input"
            value={title}
            onChange={(e) => { const v = e.target.value; setTitle(v); if (v.trim()) clearError("title"); }}
            placeholder="Event title"
            aria-required={isFieldRequired("title")}
            aria-invalid={!!errors.title}
          />
          {renderError("title")}
        </label>
      </div>

      {/* Author + Org */}
      <div className="grid-2">
        <label className={`field ${errors.author ? "field--error" : ""}`}>
          {renderLabel("author", "Author")}
          <input
            className="input"
            value={author}
            onChange={(e) => { const v = e.target.value; setAuthor(v); if (v.trim()) clearError("author"); }}
            placeholder="Your name"
            aria-required={isFieldRequired("author")}
            aria-invalid={!!errors.author}
          />
          {renderError("author")}
        </label>
        <label className={`field ${errors.org ? "field--error" : ""}`}>
          {renderLabel("org", "Organization")}
          <input
            className="input"
            value={org}
            onChange={(e) => { const v = e.target.value; setOrg(v); if (v.trim()) clearError("org"); }}
            placeholder="Company or unit"
            aria-required={isFieldRequired("org")}
            aria-invalid={!!errors.org}
          />
          {renderError("org")}
        </label>
      </div>

      {/* Email */}
      <div className="grid-1">
        <label className={`field ${errors.email ? "field--error" : ""}`}>
          {renderLabel("email", "Email")}
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => { const v = e.target.value; setEmail(v); if (v.trim()) clearError("email"); }}
            placeholder="name@example.com"
            aria-required={isFieldRequired("email")}
            aria-invalid={!!errors.email}
          />
          {renderError("email")}
        </label>
      </div>

      {/* Location */}
      <div className="grid-2 align-end">
        <label className={`field ${errors.location ? "field--error" : ""}`}>
          {renderLabel("location", "Location")}
          <input
            className="input"
            value={location}
            onChange={(e) => { const v = e.target.value; setLocation(v); if (v.trim()) clearError("location"); }}
            placeholder="University, Campus, Bunkern"
            disabled={onCampus}
            aria-required={isFieldRequired("location")}
            aria-invalid={!!errors.location}
          />
          {renderError("location")}
        </label>

        <label className="checkbox checkbox--center">
          <input
            type="checkbox"
            checked={!!onCampus}
            onChange={(e) => {
              const checked = e.target.checked;
              setOnCampus(checked);
              if (checked || location.trim()) clearError("location");
            }}
          />
          <span>Event will be held at campus</span>
        </label>
      </div>

      {/* Max Attendees + Date */}
      <div className="grid-2">
        <label className="field">
          <span className="label">Max attendees</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder="e.g., 100"
            value={vMax}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") { setMaxAttendees(""); return; }
              const n = parseInt(raw, 10);
              setMaxAttendees(Number.isNaN(n) ? "" : Math.max(1, n));
            }}
          />
        </label>

        <label className={`field ${errors.date ? "field--error" : ""}`}>
          {renderLabel("date", "Date")}
          <div className="input-wrap">
            <input
              ref={dateRef}
              className="input input--with-icon"
              type="date"
              lang = {TIME_LANG}
              value={vDate}
              onChange={(e) => { const v = e.target.value; setDate(v); if (v) clearError("date"); }}
              aria-required={isFieldRequired("date")}
              aria-invalid={!!errors.date}
            />
            <button
              className="input-icon"
              type="button"
              onMouseDown={(e) => { e.preventDefault(); openPicker(dateRef); }}
              onClick={() => openPicker(dateRef)}
              aria-label="Open calendar picker"
            >
              <IconCalendar />
            </button>
          </div>
          {renderError("date")}
        </label>
      </div>

      {/* Start Time + End Time */}
      <div className="grid-2">
        <label className={`field ${errors.startTime ? "field--error" : ""}`}>
          {renderLabel("startTime", "Start time")}
          <input
            className="input"
            type="time"
            lang = {TIME_LANG}
            value={vStart}
            onChange={(e) => {
              const v = e.target.value;
              setStartTime(v);
              if (v) clearError("startTime");
              if (endTime && v && v < endTime) clearError("endTime");
            }}
            aria-required={isFieldRequired("startTime")}
            aria-invalid={!!errors.startTime}
          />
          {renderError("startTime")}
        </label>

        <label className={`field ${errors.endTime ? "field--error" : ""}`}>
          {renderLabel("endTime", "End time")}
          <input
            className="input"
            type="time"
            value={vEnd}
            onChange={(e) => {
              const v = e.target.value;
              setEndTime(v);
              if (v && (!startTime || startTime < v)) clearError("endTime");
            }}
            aria-required={isFieldRequired("endTime")}
            aria-invalid={!!errors.endTime}
          />
          {renderError("endTime")}
        </label>
      </div>

      {/* Description */}
      <div className="grid-1">
        <label className={`field ${errors.description ? "field--error" : ""}`}>
          {renderLabel("description", "Description (plain text)")}
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => { const v = e.target.value; setDescription(v); if (v.trim()) clearError("description"); }}
            placeholder="Short event description…"
            aria-required={isFieldRequired("description")}
            aria-invalid={!!errors.description}
          />
          {renderError("description")}
        </label>
      </div>

      {/* Departments */}
      <div className="fieldset-wrap">
        <div className="group-header">DEPARTMENTS</div>

        <fieldset
          className={`fieldset ${errors.departments ? "fieldset--error" : ""} ${publishAll ? "fieldset--disabled" : ""}`}
          aria-disabled={publishAll ? "true" : "false"}
        >
          <legend className="legend legend--sr">{deptLabel}</legend>

          <div
            className="chips"
            role="group"
            aria-label="Departments"
            aria-required={isFieldRequired("departments")}
            aria-invalid={!!errors.departments}
          >
            {categories.map((d) => {
              const checked = depts.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  className={`chip ${checked ? "chip--on" : ""}`}
                  onClick={() => toggleDept(d)}
                  aria-pressed={checked}
                  disabled={publishAll}
                >
                  {d}
                </button>
              );
            })}
          </div>
          {renderError("departments")}
        </fieldset>
      </div>

      {/* Publish All */}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={!!publishAll}
          onChange={(e) => {
            const checked = e.target.checked;
              setPublishAll(checked);
              if (checked) {
                setDepts([]);              // override any picked departments
                clearError("departments");
              }
            }
            }/>
        <span>Publish to all departments</span>
      </label>

      {/* Attachments — drag & drop + remove */}
      <label className="field field--file">
        <span className="label">Attachments</span>

        <div
          className={`file-drop ${dragActive ? "is-drag" : ""}`}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
          aria-label="Drag and drop files here or browse"
        >
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            multiple
            onChange={onBrowse}
          />
          <div className="file-copy"><strong>Drag & drop</strong> files here</div>
        </div>

        {files?.length > 0 && (
          <ul className="file-list" role="list">
            {files.map((f, i) => (
              <li className="file-item" key={`${f.name}-${f.size}-${i}`}>
                <span className="file-name" title={f.name}>{f.name}</span>
                <span className="file-size">{(f.size/1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  className="file-remove"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => removeFileAt(i)}
                >
                  ×
                </button>
              </li>
            ))}
            <li className="file-actions">
              <button type="button" className="file-clear" onClick={clearAllFiles} aria-label="Clear all files">
                Clear all
              </button>
            </li>
          </ul>
        )}
      </label>

      <div className="actions">
        <button className="btn btn--ghost" type="reset">Reset</button>
        <button className="btn btn--submit" type="submit">Submit</button>
      </div>

      {confirmOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="modal-header">
              <h3 id="confirm-title">Ready to publish?</h3>
              <p className="modal-subtitle">Review your details, then share your event with the selected departments.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn--ghost" type="button" onClick={dismissConfirm} disabled={isSubmitting}>
                Go back
              </button>
              <button className="btn btn--submit" type="button" onClick={runSubmission} disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sentOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="sent-title">
            <div className="modal-header">
              <h3 id="sent-title">Publication sent</h3>
              <p className="modal-subtitle">Your request has been submitted successfully.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn--submit" type="button" onClick={() => setSentOpen(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2a1 1 0 0 1 2 0v1h6V2a1 1 0 1 1 2 0v1h1.2A2.8 2.8 0 0 1 21 5.8v13.4A2.8 2.8 0 0 1 18.2 22H5.8A2.8 2.8 0 0 1 3 19.2V5.8A2.8 2.8 0 0 1 5.8 3H7V2Zm12 7H5v10.2c0 .44.36.8.8.8h12.4c.44 0 .8-.36.8-.8V9Zm-2-4H7v2h10V5Z" fill="currentColor"/>
    </svg>
  );
}
