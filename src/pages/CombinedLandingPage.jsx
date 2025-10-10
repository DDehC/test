import React from "react";
import LandingPageImageSlideShow from "./LandingPageImageCarousel.jsx";
import LandingPageNewsBoard from "./LandingPageNewsBoard.jsx";

const CombinedLandingPage = () => {
  return (
    <div className="combined-landing">
      <LandingPageImageSlideShow />
      <LandingPageNewsBoard />
    </div>
  );
};

export default CombinedLandingPage;
