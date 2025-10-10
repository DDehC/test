import React from "react";
import "./RegisterPage.css";

export default function RegisterPage() {
  function handleSubmit(e) {
    e.preventDefault();
    // TODO: integrate API call here
  }

  return (
    <main className="container register-page">
      <form onSubmit={handleSubmit} className="register-form">
        <h1>Register User</h1>

        <label>
          <span>Full name</span>
          <input type="text" placeholder="Jane Doe" required />
        </label>

        <label>
          <span>Email</span>
          <input type="email" placeholder="name@example.com" required />
        </label>

        <label>
          <span>Password</span>
          <input type="password" placeholder="••••••••" required />
        </label>

        <label>
          <span>Role</span>
          <select defaultValue="staff" required>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="register-actions">
          <button type="submit">Create User</button>
          <button type="reset">Clear</button>
        </div>
      </form>
    </main>
  );
}
