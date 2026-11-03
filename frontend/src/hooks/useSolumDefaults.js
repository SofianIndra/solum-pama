"use client";
import { useEffect, useState } from "react";
import { getSolumDefaults } from "@/services/PanamaApi/solumService";

const EMPTY_DEFAULTS = { company: "", store: "", led_duration: "" };

// Loads SOLUM_COMPANY / SOLUM_STORE / SOLUM_LED_DURATION from the backend once. If the backend cannot be
// reached the interceptor already toasted it, and the forms start empty so the user can still type them.
export const useSolumDefaults = () => {
  const [state, setState] = useState({ defaults: EMPTY_DEFAULTS, isLoading: true });

  useEffect(() => {
    let isActive = true;
    getSolumDefaults()
      .then((defaults) => isActive && setState({ defaults, isLoading: false }))
      .catch(() => isActive && setState({ defaults: EMPTY_DEFAULTS, isLoading: false }));
    return () => {
      isActive = false;
    };
  }, []);

  return state;
};
