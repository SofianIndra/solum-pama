const SectionCard = ({ step, title, description, action, children, className = "" }) => {
  return (
    <section className={`rounded-xl border border-border bg-white shadow-sm ${className}`}>
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        {step && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary ring-1 ring-primary/15">
            {step}
          </span>
        )}
        <div className="flex-1">
          <h2 className="text-base font-semibold text-heading">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
};

export default SectionCard;
