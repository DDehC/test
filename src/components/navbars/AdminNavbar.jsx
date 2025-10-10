import { Link } from "react-router-dom";
import nodlogo from "../../assets/nodlogo.png";
import "../../App.css";
import "./navbar.css";

export default function AdminNavbar() {
  return (
    <nav className="navbar">
      <Link to="/admin" className="brand">
        <img src={nodlogo} alt="Logo" className="logo-brand" />
      </Link>
      <div className="nav-right">
        <Link className="nav-link" to="/">Welcome Page</Link>
        <Link className="nav-link" to="/calendar">Calendar</Link>
        <Link className="nav-link" to="/admin/requests">Requests</Link>
        <Link className="nav-link" to="/admin/publish">Publish</Link>
        <Link className="nav-link" to="/admin/users">Users</Link>
      </div>
    </nav>
  );
}
