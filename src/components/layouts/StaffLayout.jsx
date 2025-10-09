import { useEffect } from "react";
import { setRole } from "../../utils/landing";
import { Outlet } from "react-router-dom";
import StaffNavbar from "../navbars/StaffNavbar.jsx";
import Footer from "../Footer.jsx";
import SignOutButton from "../SignOutButton.jsx";

export default function StaffLayout() {
  useEffect(() => { setRole("staff"); }, []);
  return (
    <div className="layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <StaffNavbar />
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
        <SignOutButton />
      </div>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
