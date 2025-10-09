// frontend/src/components/navbars/PublicNavbar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { getRole, ROLE_LANDING, markLanding } from "../../utils/landing";
import nodlogo from "../../assets/nodlogo.png";
import "../../App.css";
import "./navbar.css";

/*Imports icons */
import { FiLogIn, FiUser } from "react-icons/fi";

export default function PublicNavbar() {
  const rawRole = getRole() || "guest";
  const role = rawRole === "publisher" ? "staff" : rawRole;

  const homeHref = useMemo(() => ROLE_LANDING[role] || "/", [role]);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== "guest" && (pathname === "/" || pathname === "/login")) {
      markLanding(homeHref);
      navigate(homeHref, { replace: true });
      return;
    }
    const prefix = (pathname.split("/")[1] || "").toLowerCase();
    if (["student", "staff", "admin"].includes(prefix)) {
      if (role === "guest") {
        navigate("/login", { replace: true });
        return;
      }
      const expected = ROLE_LANDING[role];
      if (expected && expected !== `/${prefix}`) {
        navigate(expected, { replace: true });
      }
    }
  }, [role, pathname, homeHref, navigate]);

  return (
    <nav className="navbar">
      <Link to={homeHref} className="brand">
        <img src={nodlogo} alt="Logo" className="logo-brand" />
      </Link>
      <div className="nav-right">
        <Link className="nav-link" to="/">Welcome Page</Link>
        <Link className="nav-link" to="/calendar">Calendar</Link>
        <Link className="nav-link" to="/student">Student page</Link>
        <Link className="nav-link" to="/staff">Staff page</Link>
        <Link className="nav-link" to="/admin">Admin page</Link>
        {/* Profile link with icon */}
        <Link className="nav-link flex items-center gap-1" to="/profile">
          <FiUser size={20} /> 
        </Link>

        {/* Sign in link with icon */}
        <Link className="nav-link flex items-center gap-1" to="/login">
          Sign In <FiLogIn size={20} /> 
        </Link>
      </div>
    </nav>
  );
}
