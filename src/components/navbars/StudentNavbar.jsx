import { Link } from "react-router-dom";
import nodlogo from "../../assets/nodlogo.png";
import "../../App.css";
import "./navbar.css";

export default function StudentNavbar() {
  return (
    <nav className="navbar">
      <Link to="/student" className="brand">
        <img src={nodlogo} alt="Logo" className="logo-brand" />
      </Link>
      <div className="nav-right">
        <Link className="nav-link" to="/">Welcome Page</Link>
        <Link className="nav-link" to="/calendar">Calendar</Link>
      </div>
    </nav>
  );
}
