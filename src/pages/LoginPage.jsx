// frontend/src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { setRole, ROLE_LANDING } from "../utils/landing";
import "../App.css";

export default function LoginPage() {
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [remember, setRemember]   = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser({ username, password, remember });

      // accept either top-level `role` or nested `user.role`
      const raw = res?.role || res?.user?.role || "guest";
      const norm =
        raw === "publisher" ? "staff" :
        (["student", "staff", "admin"].includes(raw) ? raw : "guest");

      setRole(norm);
      try { localStorage.setItem("remember", remember ? "1" : "0"); } catch {}

      const target = ROLE_LANDING[norm] || "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bare-main" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="auth-card" style={{ width: "100%", maxWidth: 520 }}>
        <h1 className="login-title">Sign in</h1>
        <form className="login-form" onSubmit={handleSubmit} style={{ alignItems: "stretch" }}>
          <label>
            Username or email
            <input
              placeholder="your.name@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label
            htmlFor="remember"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              width: "auto",
              margin: "6px 0 12px 0",
              alignSelf: "flex-start"
            }}
          >
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span>Remember me</span>
          </label>

          <button type="submit" disabled={loading || !username || !password}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {error && (
            <div style={{ color: "#b91c1c", fontSize: ".9rem" }}>
              {error}
            </div>
          )}

           <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <span style={{ fontSize: ".95rem", color: "#333" }}>Not a user?</span>
              <button
                type="button"
                onClick={() => navigate("/register", { state: { fromLogin: true } })}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "#185adb", 
                  fontWeight: 600, 
                  cursor: "pointer", 
                  padding: 0, 
                  textDecoration: "underline" 
                }}>
                  
                Register here
              </button>
          </div>

        </form>
      </div>
    </main>
  );
}
