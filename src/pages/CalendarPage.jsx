// frontend/src/pages/CalendarPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/CalendarPage.css";

function fmtHM(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [items, setItems] = useState([]);         // FullCalendar events
  const [selected, setSelected] = useState(null); // modal payload

  // Lock horizontal scrolling while mounted
  useEffect(() => {
    document.documentElement.classList.add("no-x");
    document.body.classList.add("no-x");
    return () => {
      document.documentElement.classList.remove("no-x");
      document.body.classList.remove("no-x");
    };
  }, []);

  // Fetch events for a visible range (approved + visible only; backend handles this)
  const load = useCallback(async (startDate, endDate) => {
    const qs = new URLSearchParams({ start: ymd(startDate), end: ymd(endDate) });
    const res = await fetch(`/api/req/calendar?${qs.toString()}`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const items = (body.items || []).map((ev) => ({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      // keep extra data for the modal
      extendedProps: {
        location: ev.location,
        on_campus: !!ev.on_campus,
        description: ev.description,
        departments: ev.departments || [],
        max_attendees: ev.max_attendees ?? null,
      },
    }));
    setItems(items);
  }, []);

  return (
    <div className="cal-page">
      <div className="cal-wrap">
        <div className="cal-card">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            firstDay={1}
            displayEventTime={false}
            expandRows={true}
            height="auto"
            dayMaxEventRows={3}
            fixedWeekCount={false}
            showNonCurrentDates={true}
            nowIndicator={true}
            selectable={false}
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}

            // fetch whenever the user navigates the calendar
            datesSet={(info) => {
              // info.start is inclusive, info.end is exclusive
              load(info.start, info.end).catch(console.error);
            }}

            events={items}

            eventClick={(arg) => {
              const ev = arg.event;
              setSelected({
                id: ev.id,
                title: ev.title,
                start: ev.start?.toISOString(),
                end: ev.end?.toISOString(),
                ...ev.extendedProps,
              });
            }}
          />
        </div>
      </div>

      {selected && (
        <div className="cal-modal" role="dialog" aria-modal="true">
          <div className="cal-sheet">
            <header className="cal-modal-head">
              <h2>{selected.title || "Event"}</h2>
              <button className="cal-x" onClick={() => setSelected(null)} aria-label="Close">×</button>
            </header>
            <div className="cal-modal-body">
              <div className="row"><span className="k">Time</span><span className="v">{fmtHM(selected.start)} – {fmtHM(selected.end)}</span></div>
              <div className="row"><span className="k">Location</span><span className="v">{selected.on_campus ? "Campus" : (selected.location || "—")}</span></div>
              <div className="row"><span className="k">Max attendees</span><span className="v">{selected.max_attendees ?? "—"}</span></div>
              <div className="row">
                <span className="k">Departments</span>
                <span className="v">
                  {selected.departments?.length
                    ? selected.departments.map((d, i) => <span key={i} className="cal-tag">{d}</span>)
                    : "—"}
                </span>
              </div>
              {selected.description && (
                <div className="desc">{selected.description}</div>
              )}
            </div>
          </div>

          {/* Scoped styles for the modal only */}
          <style>{`
            .cal-modal{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:60}
            .cal-sheet{width:min(640px,92vw);background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 24px 64px rgba(15,23,42,.2)}
            .cal-modal-head{display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #e5e7eb}
            .cal-modal-head h2{margin:0;font-size:18px;font-weight:800}
            .cal-x{margin-left:auto;border:0;background:transparent;font-size:24px;cursor:pointer}
            .cal-modal-body{padding:14px 16px;display:grid;gap:8px}
            .row{display:grid;grid-template-columns:140px 1fr;gap:10px}
            .k{font-size:12px;color:#64748b}
            .v{font-size:14px;color:#0f172a}
            .desc{margin-top:8px;white-space:pre-wrap}
            .cal-tag{display:inline-block;margin:0 6px 6px 0;padding:6px 10px;border-radius:999px;border:1px solid #e5e7eb;background:#fff}
          `}</style>
        </div>
      )}
    </div>
  );
}
