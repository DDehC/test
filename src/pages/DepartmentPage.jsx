import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { events } from "../events/data.js";
import { categories } from "../components/DepartmentList.js";
import { slugify, unslugify } from "../utils/slug.js";

function partitionEvents(all, deptName) {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const filtered = all.filter(
    (ev) => ev.audience === "all" || (ev.department && ev.department === deptName)
  );
  const upcoming = filtered
    .filter((ev) => new Date(ev.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentPast = filtered
    .filter((ev) => {
      const d = new Date(ev.date);
      return d < now && d >= monthAgo;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return { upcoming, recentPast };
}

export default function DepartmentPage() {
  const { slug } = useParams();

  const deptName = useMemo(() => {
    if (slug === "all-students") return null;
    const match = categories.find((c) => slugify(c) === slug);
    return match || unslugify(slug);
  }, [slug]);

  const { upcoming, recentPast } = useMemo(
    () => partitionEvents(events, deptName),
    [deptName]
  );

  const title = deptName ? deptName : "Alla studenter";

  return (
    <main className="container dept-page">
      <div className="dept-wrap">
        <header className="dept-header">
          <h1 className="dept-title">{title}</h1>
        </header>

        <section className="dept-section">
          <h2 className="dept-h2">Upcoming events</h2>
          {upcoming.length === 0 ? (
            <div className="dept-empty">No upcoming events.</div>
          ) : (
            <ul className="event-list">
              {upcoming.map((ev) => (
                <li key={ev.id} className="event-card">
                  <div className="event-title">{ev.title}</div>
                  <div className="event-meta">
                    {new Date(ev.date).toLocaleString()} · {ev.location}
                    {ev.audience === "all" ? " · For all students" : ""}
                  </div>
                  <p className="event-desc">{ev.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dept-section">
          <h2 className="dept-h2">Past events (last 30 days)</h2>
          {recentPast.length === 0 ? (
            <div className="dept-empty">No recent past events.</div>
          ) : (
            <ul className="event-list">
              {recentPast.map((ev) => (
                <li key={ev.id} className="event-card">
                  <div className="event-title">{ev.title}</div>
                  <div className="event-meta">
                    {new Date(ev.date).toLocaleString()} · {ev.location}
                    {ev.audience === "all" ? " · For all students" : ""}
                  </div>
                  <p className="event-desc">{ev.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
