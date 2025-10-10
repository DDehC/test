import { Outlet } from "react-router-dom";
import { getRole } from "../../utils/landing";
import PublicNavbar from "../navbars/PublicNavbar.jsx";
import StudentNavbar from "../navbars/StudentNavbar.jsx";
import StaffNavbar from "../navbars/StaffNavbar.jsx";
import AdminNavbar from "../navbars/AdminNavbar.jsx";
import Footer from "../Footer.jsx";

function CurrentNavbar() {
  const role = getRole();
  if (role === "student") return <StudentNavbar />;
  if (role === "staff") return <StaffNavbar />;
  if (role === "admin") return <AdminNavbar />;
  return <PublicNavbar />;
}

export default function RoleAwareLayout() {
  return (
    <div className="layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <CurrentNavbar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
