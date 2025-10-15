import "../App.css";
import useLandingMarker from "../hooks/useLandingMarker";
import CombinedLandingPage from "./CombinedLandingPage.jsx";

export default function WelcomeLanding() {
  useLandingMarker("/");
  return (
    <main className="container landing-no-top-pad landing-no-gutters">
      <CombinedLandingPage />
    </main>
  );
}
