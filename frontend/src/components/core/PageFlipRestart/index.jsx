"use client";
import { useEffect } from "react";
import { restartPageFlip } from "@/services/PanamaApi/solumService";

// Module-level flag: the call is made once per web load, not again on tab changes (the layout stays
// mounted) or on the second effect run of React Strict Mode in dev. A browser reload resets it.
let hasRestarted = false;

// Each time the web is loaded the label page flip starts over from page 1. Renders nothing.
const PageFlipRestart = () => {
  useEffect(() => {
    if (hasRestarted) return;
    hasRestarted = true;
    restartPageFlip().catch(() => {});
  }, []);

  return null;
};

export default PageFlipRestart;
