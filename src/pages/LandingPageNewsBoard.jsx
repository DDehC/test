import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, ROLE_LANDING } from "../utils/landing"; 
import { Newspaper, ArrowRight, ChevronDown } from "lucide-react";
import DepartmentsCard from "../components/DepartmentsCard.jsx";
import "../styles/LandingPageNewsBoard.css";

/* ---------- helpers ---------- */
const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const hhmm = (d) =>
  d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
const timeRange = (start, end) => (start && end ? `${start}–${end}` : "");

const API = "/api";

export function useEvents() {
  const [items, setItems] = useState([]); 

  useEffect(() => {
    document.documentElement.classList.add("no-x");
    document.body.classList.add("no-x");
    return () => {
      document.documentElement.classList.remove("no-x");
      document.body.classList.remove("no-x");
    };
  }, []);

  const load = useCallback(async (startDate, endDate) => {
    const qs = new URLSearchParams({
      start: ymdLocal(startDate),
      end: ymdLocal(endDate),
    });

    const res = await fetch(`/api/req/eventfetch?${qs.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();

    const parsed = (body.items || []).map((ev) => {
      const start = ev.start ? new Date(ev.start) : null;
      const end = ev.end ? new Date(ev.end) : null;

      return {
        id: ev.id,
        date: start ? ymdLocal(start) : null,
        title: ev.title ?? "",
        start_time: start ? hhmm(start) : null,
        end_time: end ? hhmm(end) : null,
        location: ev.location ?? "",
        description: ev.description ?? "",
      };
    });

    setItems(parsed);
  }, []);

  return { items, load };
}

async function registerForEvent(eventId) {
  const res = await fetch(`${API}/auth/register_event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",              // <-- send session cookie
    body: JSON.stringify({ event_id: eventId }),
  });
  const body = await res.json();
  if (!res.ok || body.success !== true) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}

const NewsBoard = () => {
  const [openIndex, setOpenIndex] = React.useState(0);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();
  const role = getRole() || "guest";

  const { items, load } = useEvents();

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    load(start, end);
  }, [load]);

  const EVENTS = useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        date: it.date,
        title: it.title,
        time: timeRange(it.start_time, it.end_time),
        location: it.location || "",
        description: it.description || "",
      })),
    [items]
  );

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  async function handleAttendClick(eventId) {
    if (role === "guest") {
      navigate("/login");
      return;
    }
    try {
      setBusyId(eventId);
      const res = await registerForEvent(eventId);
      alert(res.message || "Registered for event"); // replace with your toast/snackbar
    } catch (e) {
      alert(e.message || "Failed to register");
    } finally {
      setBusyId(null);
    }
  }

  function handleAttendanceListClick() {
    navigate("/attendance-list");
  }

  return (
    <div className="newsboard">
      <aside className="newsboard-sidebar">
        <div className="newsboard-header">
          <Newspaper className="newsboard-icon" />
          <h2 className="newsboard-title">News</h2>
        </div>
        <ul className="newsboard-sidebar-list">
          {EVENTS.map(({ id, date, title }, index) => (
            <li key={id || index} className="newsboard-sidebar-item">
              <div className="newsboard-date">{date}</div>
              <div className="newsboard-item-title">{title}</div>
              <ArrowRight className="newsboard-arrow" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </aside>

      <section className="newsboard-main">
        <div className="newsboard-accordion" role="list">
          {EVENTS.map(
            ({ id, date, title, time, location, description }, index) => {
              const isOpen = openIndex === index;

              return (
                <article
                  key={title}
                  className={`newsboard-accordion-item ${isOpen ? "is-open" : ""}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="newsboard-accordion-trigger"
                    onClick={() => handleToggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`event-panel-${index}`}
                  >
                    <div className="newsboard-accordion-meta">
                      <span className="newsboard-card-date">{date}</span>
                      <ChevronDown
                        className={`newsboard-accordion-icon ${isOpen ? "rotated" : ""}`}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="newsboard-card-title">{title}</h3>
                  </button>
                  <div
                    id={`event-panel-${index}`}
                    className={`newsboard-accordion-panel ${isOpen ? "is-open" : ""}`}
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <dl className="newsboard-accordion-details">
                      <div className="newsboard-accordion-row">
                        <dt>Time</dt>
                        <dd>{time}</dd>
                      </div>
                      <div className="newsboard-accordion-row">
                        <dt>Location</dt>
                        <dd>{location}</dd>
                      </div>
                    </dl>
                    <p className="newsboard-accordion-description">{description}</p>

                    <button
                      className="newsboard-card-button"
                      type="button"
                      onClick={() => handleAttendClick(id)}   // <-- wrap to pass id
                      disabled={busyId === id}
                    >
                      {busyId === id ? "Registering..." : "Attend Event"}
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>

                    {(role === "staff" || role === "admin") && (
                      <button
                        className="newsboard-card-list-button"
                        type="button"
                        onClick={handleAttendanceListClick}
                      >
                        Attendance List
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      <aside className="newsboard-right">
        <div className="newsboard-right-inner">
          <DepartmentsCard />
        </div>
      </aside>
    </div>
  );
};

export default NewsBoard;
