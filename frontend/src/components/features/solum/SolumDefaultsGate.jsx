"use client";
import LoadingSpinner from "@/components/core/LoadingSpinner";
import { useSolumDefaults } from "@/hooks/useSolumDefaults";

// Renders children(defaults) once the backend's SOLUM defaults are known, so forms can start from them.
const SolumDefaultsGate = ({ children }) => {
  const { defaults, isLoading } = useSolumDefaults();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-muted">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return children(defaults);
};

export default SolumDefaultsGate;
