import React, { useEffect, useState, useCallback } from "react";
import "./RequestListPage.css";
import { categories } from "../components/DepartmentList.js";
import { requestsApi } from "../api/requests";
import RequestTable from "../components/RequestTable.jsx";
import RequestDrawer from "../components/RequestDrawer.jsx";

function uiToApiStatus(s) { return s === "denied" ? "rejected" : s; }
function apiToUiStatus(s) { return s === "rejected" ? "denied" : s; }

export default function RequestListPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("pending");

  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    const data = await requestsApi.list({
      page: 1,
      page_size: 200,
      status: uiToApiStatus(status),
      dept,
      q: query,
    });

    const items = Array.isArray(data.items) ? data.items : [];
    setRows(items.map((doc) => ({
      ...doc,
      id: doc.id ?? String(doc._id ?? ""),
      title: doc.title ?? "",
      organization: doc.organization ?? "",
      email: doc.email ?? "",
      date: doc.date ?? doc.created_at ?? "",
      departments: Array.isArray(doc.departments) ? doc.departments : [],
      attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
      status: apiToUiStatus(doc.status ?? "pending"),
    })));
  }, [status, dept, query]);

  useEffect(() => { load().catch(console.error); }, [load]);

  async function approve(id, fb) {
    await requestsApi.update(id, { status: "approved", feedback: fb ?? "" });
    await requestsApi.create_event(id);
    setSelected(null);
    await load();
  }
  async function deny(id, fb) {
    await requestsApi.update(id, { status: "rejected", feedback: fb ?? "" });
    setSelected(null);
    await load();
  }
  async function remove(id) {
    await requestsApi.remove(id);
    setSelected(null);
    await load();
  }

  return (
    <main className="req-page">
      <div className="req-card">
        <header className="req-head">
          <h1 className="req-title">Publish Requests</h1>
          <p className="req-sub">Filter, review, approve/deny, or delete requests.</p>
        </header>

        <section className="req-content">
          <RequestTable
            rows={rows}
            status={status}
            setStatus={setStatus}
            query={query}
            setQuery={setQuery}
            dept={dept}
            setDept={setDept}
            categories={categories}
            onSelect={(row) => {
              setSelected(row);
              setFeedback(row.feedback || "");
            }}
          />
        </section>
      </div>

      <RequestDrawer
        current={selected}
        feedback={feedback}
        setFeedback={setFeedback}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onDeny={deny}
        onDelete={(row) => remove(row.id)}
      />
    </main>
  );
}