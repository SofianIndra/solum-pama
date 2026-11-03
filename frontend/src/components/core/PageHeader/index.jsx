const PageHeader = ({ breadcrumbs = [], title, description }) => {
  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb}>
                {index > 0 && <span className="mx-1">/</span>}
                <span className={index === breadcrumbs.length - 1 ? "text-body" : ""}>{crumb}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-heading">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-body">{description}</p>}
      </div>
    </div>
  );
};

export default PageHeader;
