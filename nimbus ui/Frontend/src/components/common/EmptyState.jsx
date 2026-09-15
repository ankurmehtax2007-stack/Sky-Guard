import { Inbox } from "lucide-react";

export function EmptyState({ message, description }) {
  return (
    <div className="state-box state-empty">
      <Inbox size={24} className="state-icon" />
      <p className="state-message">{message || "No data available."}</p>
      {description && <p className="state-description">{description}</p>}
    </div>
  );
}

export function EmptyTableRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="empty-table-cell">
        {message || "No records found."}
      </td>
    </tr>
  );
}
