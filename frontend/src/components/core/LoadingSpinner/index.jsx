import { ImSpinner2 } from "react-icons/im";

const SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

const LoadingSpinner = ({ size = "md", className = "" }) => {
  return (
    <ImSpinner2 className={`animate-spin ${SIZES[size] ?? SIZES.md} ${className}`} aria-hidden="true" />
  );
};

export default LoadingSpinner;
