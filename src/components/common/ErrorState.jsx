import { AlertCircle } from "lucide-react";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box state-error">
      <AlertCircle size={20} className="state-icon" />
      <p className="state-message">{message || "Something went wrong."}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function InlineError({ message }) {
  if (!message) return null;
  return (
    <div className="inline-error">
      <AlertCircle size={14} />
      <span>{message}</span>
    </div>
  );
}
