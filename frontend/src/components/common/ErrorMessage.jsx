import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          {message && <p className="mt-1 text-sm text-rose-700">{message}</p>}
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="!border-rose-300 !text-rose-700 hover:!bg-rose-100"
                icon={RefreshCw}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
