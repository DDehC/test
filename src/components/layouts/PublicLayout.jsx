import { Outlet } from "react-router-dom";
import PublicNavbar from "../navbars/PublicNavbar.jsx";
import Footer from "../Footer.jsx";

export default function PublicLayout() {
  return (
    <div className="layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
