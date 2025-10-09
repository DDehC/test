import { useEffect } from "react";
import { markLanding } from "../utils/landing";

export default function useLandingMarker(path) {
  useEffect(() => { markLanding(path); }, [path]);
}
