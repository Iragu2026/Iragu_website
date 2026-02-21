import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

/**
 * Inline error banner — place inside a page/section to show an API error.
 */
export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="flex min-h-[30vh] items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-8 py-6 text-center">
        <FiAlertTriangle size={28} className="text-red-400" />
        <p className="text-sm text-red-700">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded bg-red-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  );
}
