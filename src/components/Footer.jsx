import React from "react";
import "../App.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div>&copy; {new Date().getFullYear()} Karlstad University</div>
      <div>
        <a
          href="https://www.kau.se/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Official Website
        </a>
      </div>
    </footer>
  );
}
