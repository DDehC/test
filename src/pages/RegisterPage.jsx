// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css"; // reuse global form/input/button styles from .login-form
import "../styles/RegisterPage.css";
import "../styles/PublicationForm.css"; // reuse .card tint

export default function RegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Gate access: only allow entry from the LoginPage button
  useEffect(() => {
    if (!location.state || location.state.fromLogin !== true) {
      navigate("/login", { replace: true });
    }
  }, [location.state, navigate]);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(form.username)) e.username = "Min 3 chars, a–z, 0–9, . _ -";
    if (form.password.length < 6) e.password = "Min 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      // TODO: integrate backend API when ready, e.g. await registerUser(form)
      console.log("Register payload", form);
      navigate("/login", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container register-page">
      <div className="card auth-card">
        <h1 className="auth-title">Create account</h1>
        <form className="login-form register-form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              placeholder="First Last"
              required
            />
            {errors.fullName && <small className="field-error">{errors.fullName}</small>}
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="you@kau.se"
              required
            />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label>
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="your_username"
              required
            />
            {errors.username && <small className="field-error">{errors.username}</small>}
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="••••••••"
              required
            />
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <label>
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setField("confirm", e.target.value)}
              placeholder="••••••••"
              required
            />
            {errors.confirm && <small className="field-error">{errors.confirm}</small>}
          </label>

          <div className="register-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create account"}
            </button>
            <button type="button" onClick={() => navigate("/login")}>Back to login</button>
          </div>
        </form>
      </div>
    </main>
  );
}
