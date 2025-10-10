import { Link } from "react-router-dom";
import nodlogo from "../../assets/nodlogo.png";
import "../../App.css";
import "./navbar.css";
import { FiUser } from "react-icons/fi";

export default function StudentNavbar() {
  return (
    <nav className="navbar">
      <Link to="/student" className="brand">
        <img src={nodlogo} alt="Logo" className="logo-brand" />
      </Link>
      <div className="nav-right">
        <Link className="nav-link" to="/">Welcome Page</Link>
        <Link className="nav-link" to="/calendar">Calendar</Link>
        {/* Profile link with icon */}
        <Link className="nav-link flex items-center gap-1" to="/profile">
          <FiUser size={20} /> 
        </Link>

        {/* Sign in link with icon */}
      </div>
    </nav>
  );
}
