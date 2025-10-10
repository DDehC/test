// frontend/src/utils/logout.js
import { logoutUser } from "../api/auth";
import { clearRole } from "./landing";

export async function doLogout() {
  try { await logoutUser(); } catch {}
  clearRole();
  window.location.replace("/login");
}
