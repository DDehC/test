import React from "react";
import "../App.css";
import useLandingMarker from "../hooks/useLandingMarker";
import CombinedLandingPage from "./CombinedLandingPage.jsx";

export default function StaffLanding() {
  useLandingMarker("/staff");
  return (
    <main className="container landing-no-top-pad landing-no-gutters">
      <CombinedLandingPage />
    </main>
  );
}
