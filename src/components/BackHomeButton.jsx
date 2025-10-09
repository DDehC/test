import React from "react";
import { Link } from "react-router-dom";
import { getLanding } from "../utils/landing";

export default function BackHomeButton() {
    return <Link to={getLanding()} className="back-btn">← Back to landing</Link>;
  return (
    <a href="/" className="back-btn">← Back to landing</a>
  );
}
