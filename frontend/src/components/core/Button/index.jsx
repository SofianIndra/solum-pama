import LoadingSpinner from "@/components/core/LoadingSpinner";

const VARIANTS = {
  primary: "bg-primary text-white shadow-sm hover:opacity-90",
  outline: "border border-border-strong bg-white text-body shadow-sm hover:bg-surface",
  ghost: "bg-transparent text-primary hover:bg-primary-soft",
  danger: "bg-transparent text-danger hover:bg-danger-soft",
  dangerSolid: "bg-danger text-white shadow-sm hover:opacity-90",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  isDisabled = false,
  loadingLabel = "Memproses...",
  ariaLabel,
  className = "",
}) => {
  const isInactive = isDisabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isInactive}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${SIZES[size] ?? SIZES.md} ${isInactive ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : icon && <span aria-hidden="true">{icon}</span>}
      {isLoading ? loadingLabel : children}
    </button>
  );
};

export default Button;
