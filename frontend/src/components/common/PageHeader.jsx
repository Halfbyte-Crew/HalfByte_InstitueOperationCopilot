import React from 'react';

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  action,
  className = '',
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center space-x-2 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label || idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-800 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
      </div>
    </div>
  );
}
