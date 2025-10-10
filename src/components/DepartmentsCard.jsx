import React from "react";
import { categories } from "./DepartmentList.js";
import { slugify } from "../utils/slug.js";
import "../App.css";

export default function DepartmentsCard() {
  return (
    <aside
      className="departments-card link-accent"
      aria-label="Departments"
      style={{
        border: "1px solid rgba(0,0,0,.12)",
        borderRadius: 8,
        padding: "0.5rem 0.75rem",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}></div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        <li style={{ margin: 0, padding: ".2rem 0", lineHeight: 1.25 }}>
          <a href="/departments/all-students">
            All Departments
          </a>
        </li>
        {categories.map((cat) => (
          <li key={cat} style={{ margin: 0, padding: ".2rem 0", lineHeight: 1.25 }}>
            <a href={`/departments/${slugify(cat)}`}>{cat}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
