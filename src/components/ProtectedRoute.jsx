// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getRole, ROLE_LANDING } from "../utils/landing";

export default function ProtectedRoute({ allowedRole, children }) {
  const raw = getRole() || "guest";
  const role = raw === "publisher" ? "staff" : raw;

  if (role === allowedRole) return children;

  const fallback = role === "guest" ? "/login" : (ROLE_LANDING[role] || "/");
  return <Navigate to={fallback} replace />;
}
