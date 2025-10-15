import React, { useEffect, useMemo, useState } from "react";
import { categories } from "../components/DepartmentList.js";
import { usersApi } from "../api/users";
import { Eye, EyeOff } from "lucide-react";
import "../styles/AdminUsersPage.css";

/* Show staff, admin, and student */
const VISIBLE_ROLES = ["staff", "admin", "student"];

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("active");

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { items } = await usersApi.list({
        search: q,
        role: role === "all" ? undefined : role,
        active: status === "active" ? true : status === "inactive" ? false : undefined,
        page: 1,
        page_size: 100,
      });
      setRows(items);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [q, role, status]);

  const visible = useMemo(
    () => rows.filter(u => VISIBLE_ROLES.includes(u.role)),
    [rows]
  );

  async function createUser(payload) {
    await usersApi.create(payload);
    setCreating(false);
    load();
  }
  async function updateUser(id, patch) {
    await usersApi.update(id, patch);
    setEditing(null);
    load();
  }
  async function removeUser(id) {
    await usersApi.remove(id);
    load();
  }
  async function toggleActive(u) {
    await usersApi.update(u.id, { active: !u.active });
    load();
  }

  return (
    <main className="users container">
      <header className="users-head">
        <h1>Users</h1>
        <div className="users-controls">
          <input
            className="inp"
            placeholder="Search name, email, dept…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />

          <select
            className="inp"
            value={role}
            onChange={(e)=>setRole(e.target.value)}
            title="Filter by role"
          >
            <option value="all">All roles</option>
            {VISIBLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            className="inp"
            value={status}
            onChange={(e)=>setStatus(e.target.value)}
            title="Filter by status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>

          <button className="btn btn--primary" onClick={()=>setCreating(true)}>Create user</button>
        </div>
      </header>

      <section className="users-card">
        {error && (
          <div style={{ padding:12, color:"#b91c1c", borderBottom:"1px solid rgba(0,0,0,.1)" }}>
            {error}
          </div>
        )}
        {loading ? (
          <div className="empty">Loading…</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(u=>(
                <tr key={u.id}>
                  <td className="strong">{u.name}</td>
                  <td><a href={`mailto:${u.email}`} className="muted">{u.email}</a></td>
                  <td className="caps">{u.role}</td>
                  <td>{u.dept || "—"}</td>
                  <td>{u.active ? <span className="badge badge--ok">Active</span> : <span className="badge badge--off">Inactive</span>}</td>
                  <td className="row-actions">
                    <button className="btn" onClick={()=>setEditing(u)}>Edit</button>
                    <button className="btn" onClick={()=>toggleActive(u)}>{u.active ? "Deactivate" : "Activate"}</button>
                    <button className="btn btn--danger" onClick={()=>confirmDelete(u, removeUser)}>Delete</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="6" className="empty">No users</td></tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {creating && (
        <UserModal
          title="Create user"
          onClose={()=>setCreating(false)}
          onSubmit={(data)=>createUser(data)}
        />
      )}
      {editing && (
        <UserModal
          title="Edit user"
          initial={editing}
          onClose={()=>setEditing(null)}
          onSubmit={(data)=>updateUser(editing.id, data)}
        />
      )}
    </main>
  );
}

function confirmDelete(user, onDelete){
  if (window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) onDelete(user.id);
}

// ---------- Password input component ----------
function PasswordInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="inp"
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer"
        }}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ---------- User modal ----------
function UserModal({ title, initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [role, setRole] = useState(
    VISIBLE_ROLES.includes(initial?.role) ? initial.role : "staff"
  );
  const [dept, setDept] = useState(initial?.dept || "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [password, setPassword] = useState("");

  useEffect(() => { if (role === "admin") setDept("—"); }, [role]);

  function submit(e){
    e.preventDefault();
    const payload = { name: name.trim(), email: email.trim(), role, dept: dept.trim(), active };
    if (password.trim()) payload.password = password.trim();
    onSubmit(payload);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="form" onSubmit={submit}>
          <div className="grid-2">
            <label>Full name<input className="inp" value={name} onChange={(e)=>setName(e.target.value)} required/></label>
            <label>Email<input className="inp" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label>
          </div>
          <div className="grid-2">
            <label>Role
              <select className="inp" value={role} onChange={(e)=>setRole(e.target.value)}>
                {VISIBLE_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label>Department
              <select className="inp" value={dept} onChange={(e)=>setDept(e.target.value)} disabled={role === "admin"}>
                <option value="—">—</option>
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </label>
          </div>
          <label className="chk"><input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} /> Active</label>
          <label>Password (leave blank to keep current)</label>
          <PasswordInput value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••"/>
          <div className="actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <div className="spacer" />
            <button type="submit" className="btn btn--primary">{initial ? "Save changes" : "Create user"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

