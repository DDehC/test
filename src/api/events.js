// frontend/src/api/events.js
import { http } from "./client";

const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "1") === "1";

/* Real endpoints you can implement later (FullCalendar friendly)
GET /api/events?start=ISO&end=ISO               -> [{ id,title,start,end,allDay,extendedProps:{type,dept} }]
POST/PUT/PATCH as needed for CRUD (not used yet)
*/
const real_list = (params = {}) => {
  const q = new URLSearchParams(params);
  return http.get(`/events?${q.toString()}`);
};

/* ----------------------- Mocks ----------------------- */
const LS = "mock.events.v1";
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function monthBase(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function iso(y,m,d,h=0,min=0){ return new Date(y,m,d,h,min,0).toISOString(); }

function seedForCurrentMonth() {
  const base = monthBase();
  const y = base.getFullYear();
  const m = base.getMonth();

  return [
    // career/events
    { id:"e1", title:"Career Fair kickoff", start: iso(y,m,3,10), end: iso(y,m,3,12), allDay:false, extendedProps:{ type:"career", dept:"All students" } },
    { id:"e2", title:"Resume workshop",   start: iso(y,m,10,14), end: iso(y,m,10,16), allDay:false, extendedProps:{ type:"career", dept:"Handelshögskolan" }},

    // lectures
    { id:"e3", title:"Guest lecture: Green Logistics", start: iso(y,m,12,9), end: iso(y,m,12,10,30), allDay:false, extendedProps:{ type:"lecture", dept:"Handelshögskolan" }},
    { id:"e4", title:"AI in Education",                 start: iso(y,m,18,13), end: iso(y,m,18,14,30), allDay:false, extendedProps:{ type:"lecture", dept:"Institutionen för matematik och datavetenskap" }},

    // exams
    { id:"e5", title:"Midterm: Algorithms", start: iso(y,m,24), end: iso(y,m,24), allDay:true, extendedProps:{ type:"exam", dept:"Institutionen för matematik och datavetenskap" }},

    // workshops
    { id:"e6", title:"Data Viz Workshop", start: iso(y,m,20,9), end: iso(y,m,20,12), allDay:false, extendedProps:{ type:"workshop", dept:"Institutionen för matematik och datavetenskap" }},
    { id:"e7", title:"Prototyping Lab",   start: iso(y,m,27,13), end: iso(y,m,27,16), allDay:false, extendedProps:{ type:"workshop", dept:"Institutionen för ingenjörsvetenskap och fysik" }},

    // holidays / all-day spans
    { id:"e8", title:"Reading Day", start: iso(y,m,6), end: iso(y,m,6), allDay:true, extendedProps:{ type:"holiday", dept:"All students" }},
    { id:"e9", title:"Hackathon weekend", start: iso(y,m,14), end: iso(y,m,15), allDay:true, extendedProps:{ type:"career", dept:"All students" }},
  ];
}

function read() {
  try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch { return null; }
}
function write(rows) {
  try { localStorage.setItem(LS, JSON.stringify(rows)); } catch {}
}
if (USE_MOCKS && !read()) write(seedForCurrentMonth());

async function mock_list(params = {}) {
  await delay(120);
  // Optional range filtering like FullCalendar would pass
  const rows = read() || [];
  const { start, end } = params;
  if (!start || !end) return rows;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return rows.filter(ev => {
    const a = new Date(ev.start).getTime();
    const b = new Date(ev.end || ev.start).getTime();
    return b >= s && a <= e; // overlap
  });
}

export const eventsApi = USE_MOCKS
  ? { list: mock_list }
  : { list: real_list };
