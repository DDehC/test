// frontend/src/components/SignOutButton.jsx
import React from "react";
import { doLogout } from "../utils/logout";

export default function SignOutButton({ className }) {
  return (
    <button className={className || "btn btn-outline"} onClick={doLogout}>
      Sign out
    </button>
  );
}
