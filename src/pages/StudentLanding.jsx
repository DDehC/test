import React from "react";
import "../App.css";
import useLandingMarker from "../hooks/useLandingMarker";
import CombinedLandingPage from "./CombinedLandingPage.jsx";

export default function StudentLanding() {
  useLandingMarker("/student");
  return (
    <main className="container student landing-no-top-pad landing-no-gutters">
      <CombinedLandingPage />
    </main>
  );
}
