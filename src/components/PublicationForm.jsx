import React from "react";
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
    for (const [k, v] of Object.entries(fns)) if (typeof v !== "function") throw new Error(`${k} is not a function`);
  }

  const vMax = maxAttendees == null ? "" : String(maxAttendees);
  const vDate = date || "";
  const vStart = startTime || "";
  const vEnd = endTime || "";

  const toggleDept = (dept) =>
    depts.includes(dept) ? setDepts(depts.filter((d) => d !== dept)) : setDepts([...depts, dept]);

  const handleFiles = (e) => setFiles([...e.target.files]);

  return (
    <form className="pub-form card" onSubmit={onSubmit} onReset={onReset} noValidate>
      <div className="card-head">
        <h2 className="title">Publication Request</h2>
      </div>

      <div className="grid-1">
        <label className="field">
          <span className="label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span className="label">Author</span>
          <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
        </label>
        <label className="field">
          <span className="label">Organization</span>
          <input className="input" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Company or unit" />
        </label>
      </div>

      <div className="grid-1">
        <label className="field">
          <span className="label">Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </label>
      </div>

      <div className="grid-2 align-end">
        <label className="field">
          <span className="label">Location</span>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Hall A, Building X"
            disabled={onCampus}
          />
        </label>

        <label className="checkbox">
          <input type="checkbox" checked={!!onCampus} onChange={(e) => setOnCampus(e.target.checked)} />
          <span>Event will be held at campus</span>
        </label>
      </div>

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

        <label className="field">
          <span className="label">Date</span>
          <input className="input" type="date" value={vDate} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span className="label">Start time</span>
          <input className="input" type="time" value={vStart} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">End time</span>
          <input className="input" type="time" value={vEnd} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>

      <div className="grid-1">
        <label className="field">
          <span className="label">Description (plain text)</span>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short event description…" />
        </label>
      </div>

      <fieldset className="fieldset">
        <legend className="legend">Departments</legend>
        <div className="chips">
          {categories.map((d) => {
            const checked = depts.includes(d);
            return (
              <button
                key={d}
                type="button"
                className={`chip ${checked ? "chip--on" : ""}`}
                onClick={() => toggleDept(d)}
                aria-pressed={checked}
              >
                {d}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="checkbox">
        <input type="checkbox" checked={!!publishAll} onChange={(e) => setPublishAll(e.target.checked)} />
        <span>Publish to all departments</span>
      </label>

      <label className="field">
        <span className="label">Attachments</span>
        <input className="input" type="file" multiple onChange={handleFiles} />
      </label>

      <div className="actions">
        <button className="btn btn--ghost" type="reset">Reset</button>
        <button className="btn" type="submit">Submit</button>
      </div>
    </form>
  );
}
